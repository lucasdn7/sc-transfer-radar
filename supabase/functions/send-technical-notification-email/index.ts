import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = { "Content-Type": "application/json" }

type Recipient = { email: string; name: string | null }
type Process = { process_number: string; object: string; municipalities: { name: string } | null }

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] || character))
}

function safeError(message: string) {
  return message.replace(/(re_[A-Za-z0-9_-]+|Bearer\s+\S+)/g, "[redacted]").slice(0, 500)
}

serve(async req => {
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders })
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const resendKey = Deno.env.get("RESEND_API_KEY")
  if (!supabaseUrl || !serviceKey || !resendKey) return new Response(JSON.stringify({ error: "Configuração segura incompleta" }), { status: 500, headers: corsHeaders })
  if (req.headers.get("Authorization") !== `Bearer ${serviceKey}`) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: corsHeaders })

  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  let deliveryId = ""
  try {
    const body = await req.json() as { delivery_id?: string }
    deliveryId = body.delivery_id || ""
    if (!deliveryId) throw new Error("delivery_id é obrigatório")

    const { data: delivery, error: deliveryError } = await admin.from("technical_notification_deliveries").select("id, notification_id, occurrence_key, scheduled_for, email_status").eq("id", deliveryId).single()
    if (deliveryError) throw deliveryError
    if (["sent", "not_requested", "cancelled"].includes(delivery.email_status)) return new Response(JSON.stringify({ status: delivery.email_status }), { status: 200, headers: corsHeaders })

    const [{ data: notification, error: notificationError }, { data: recipients, error: recipientsError }, { data: links, error: linksError }] = await Promise.all([
      admin.from("technical_notifications").select("id, title, description, schedule_type, scheduled_at").eq("id", delivery.notification_id).is("deleted_at", null).single(),
      admin.from("technical_notification_email_recipients").select("email, name").eq("notification_id", delivery.notification_id),
      admin.from("technical_notification_processes").select("process_id").eq("notification_id", delivery.notification_id),
    ])
    if (notificationError) throw notificationError
    if (recipientsError) throw recipientsError
    if (linksError) throw linksError
    if (!recipients || recipients.length === 0) {
      await admin.from("technical_notification_deliveries").update({ email_status: "not_requested" }).eq("id", deliveryId)
      return new Response(JSON.stringify({ status: "not_requested" }), { status: 200, headers: corsHeaders })
    }

    const processIds = (links || []).map(link => link.process_id)
    let processes: Process[] = []
    if (processIds.length > 0) {
      const { data, error } = await admin.from("processes").select("process_number, object, municipalities(name)").in("id", processIds)
      if (error) throw error
      processes = (data || []) as Process[]
    }

    await admin.from("technical_notification_deliveries").update({ email_status: "pending", processing_attempts: 1 }).eq("id", deliveryId).neq("email_status", "sent")
    const baseUrl = Deno.env.get("APP_BASE_URL") || supabaseUrl
    const processText = processes.length ? processes.map(process => `${process.process_number} - ${process.municipalities?.name || "Município não informado"}`).join("\n") : "Sem processos relacionados"
    const processHtml = processes.length ? `<ul>${processes.map(process => `<li>${escapeHtml(process.process_number)} - ${escapeHtml(process.municipalities?.name || "Município não informado")} - ${escapeHtml(process.object)}</li>`).join("")}</ul>` : "<p>Sem processos relacionados.</p>"
    const recurrence = notification.schedule_type === "once" ? "Uma única vez" : `Recorrência: ${escapeHtml(notification.schedule_type)}`
    const subject = `Transfer Radar SC: ${notification.title}`
    const html = `<h2>${escapeHtml(notification.title)}</h2><p>${escapeHtml(notification.description).replace(/\n/g, "<br>")}</p><p><strong>Data programada:</strong> ${escapeHtml(delivery.scheduled_for)}<br><strong>${recurrence}</strong></p><h3>Processos relacionados</h3>${processHtml}<p><a href="${escapeHtml(baseUrl)}/technical-notifications">Abrir no Transfer Radar SC</a></p><p>Esta notificação também está disponível no sino da área técnica.</p>`
    const text = `${notification.title}\n\n${notification.description}\n\nData programada: ${delivery.scheduled_for}\n${recurrence}\n\nProcessos relacionados:\n${processText}\n\nAbrir: ${baseUrl}/technical-notifications\nEsta notificação também está disponível no sino da área técnica.`
    const fromName = Deno.env.get("NOTIFICATION_FROM_NAME") || "Transfer Radar SC"
    const fromEmail = Deno.env.get("NOTIFICATION_FROM_EMAIL")
    if (!fromEmail) throw new Error("NOTIFICATION_FROM_EMAIL não configurado")
    const resendResponse = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: `${fromName} <${fromEmail}>`, to: (recipients as Recipient[]).map(recipient => recipient.email), subject, html, text }) })
    if (!resendResponse.ok) throw new Error(`Resend respondeu com status ${resendResponse.status}`)
    const sentAt = new Date().toISOString()
    await admin.from("technical_notification_deliveries").update({ email_status: "sent", email_sent_at: sentAt, email_error: null, delivered_at: sentAt }).eq("id", deliveryId)
    await admin.from("technical_notification_audit_logs").insert({ notification_id: delivery.notification_id, action: "email_sent", metadata: { delivery_id: deliveryId, occurrence_key: delivery.occurrence_key, recipient_count: recipients.length } })
    return new Response(JSON.stringify({ status: "sent", delivery_id: deliveryId }), { status: 200, headers: corsHeaders })
  } catch (error) {
    const message = safeError(error instanceof Error ? error.message : "Erro desconhecido")
    if (deliveryId) {
      await admin.from("technical_notification_deliveries").update({ email_status: "failed", email_error: message }).eq("id", deliveryId)
      const { data: failedDelivery } = await admin.from("technical_notification_deliveries").select("notification_id, occurrence_key").eq("id", deliveryId).maybeSingle()
      if (failedDelivery) await admin.from("technical_notification_audit_logs").insert({ notification_id: failedDelivery.notification_id, action: "email_failed", metadata: { delivery_id: deliveryId, occurrence_key: failedDelivery.occurrence_key, error: message } })
    }
    return new Response(JSON.stringify({ error: "Falha no envio do e-mail", delivery_id: deliveryId }), { status: 500, headers: corsHeaders })
  }
})
