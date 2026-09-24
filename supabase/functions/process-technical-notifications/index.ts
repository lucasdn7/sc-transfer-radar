import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { calculateNextOccurrence, isDue, PROCESSOR_TOLERANCE_MS } from "../_shared/notificationDateUtils.ts"

const headers = { "Content-Type": "application/json" }
const MAX_CATCH_UP_OCCURRENCES = 100

type NotificationRow = {
  id: string
  title: string
  description: string
  status: string
  schedule_type: string
  scheduled_at: string
  next_run_at: string | null
  recurrence_config: Record<string, unknown> | null
}

type DeliveryRow = { id: string; email_status: string; occurrence_key: string }
type EdgeDatabase = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas")
  return { admin: createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }), url, key }
}

function validateNotification(notification: NotificationRow) {
  if (!notification.title.trim() || notification.title.length > 150) throw new Error("Título inválido")
  if (!notification.description.trim() || notification.description.length > 5000) throw new Error("Descrição inválida")
  const allowed = ["once", "daily", "weekly", "monthly", "yearly", "business_days", "custom_interval"]
  if (!allowed.includes(notification.schedule_type)) throw new Error("Tipo de recorrência inválido")
  const config = notification.recurrence_config || {}
  if (notification.schedule_type !== "once" && Number(config.interval || 1) <= 0) throw new Error("Intervalo inválido")
  if (notification.schedule_type === "weekly" && (!Array.isArray(config.weekdays) || config.weekdays.length === 0)) throw new Error("Dias semanais ausentes")
  if (notification.schedule_type === "custom_interval" && (!['hour', 'day', 'week', 'month'].includes(String(config.custom_unit)) || Number(config.custom_value) <= 0)) throw new Error("Intervalo customizado inválido")
}

async function invokeEmail(url: string, key: string, deliveryId: string) {
  const response = await fetch(`${url}/functions/v1/send-technical-notification-email`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ delivery_id: deliveryId }) })
  return response.ok
}

async function processOne(admin: SupabaseClient<EdgeDatabase>, url: string, key: string, notification: NotificationRow, now: Date) {
  validateNotification(notification)
  let occurrence = new Date(notification.next_run_at || notification.scheduled_at)
  if (!isDue(occurrence, now)) return { processed: false, emailFailed: false }
  let processed = false
  let emailFailed = false
  let catchUp = 0

  while (occurrence && isDue(occurrence, now) && catchUp < MAX_CATCH_UP_OCCURRENCES) {
    const occurrenceKey = occurrence.toISOString()
    const { data: insertedDelivery, error: insertError } = await admin.from("technical_notification_deliveries").insert({ notification_id: notification.id, occurrence_key: occurrenceKey, scheduled_for: occurrence.toISOString() }).select("id, email_status, occurrence_key").maybeSingle()
    let delivery = insertedDelivery as DeliveryRow | null
    if (insertError && insertError.code !== "23505") throw insertError
    if (!delivery) {
      const { data, error } = await admin.from("technical_notification_deliveries").select("id, email_status, occurrence_key").eq("notification_id", notification.id).eq("occurrence_key", occurrenceKey).maybeSingle()
      if (error) throw error
      delivery = data as DeliveryRow | null
    }
    if (!delivery) throw new Error("Não foi possível reservar a ocorrência")

    const { data: recipients, error: recipientsError } = await admin.from("technical_notification_email_recipients").select("id").eq("notification_id", notification.id)
    if (recipientsError) throw recipientsError
    const wantsEmail = (recipients || []).length > 0
    const nextEmailStatus = delivery.email_status === "sent" ? "sent" : wantsEmail ? "pending" : "not_requested"
    const { error: activateError } = await admin.from("technical_notification_deliveries").update({ in_app_delivered: true, delivered_at: new Date().toISOString(), email_status: nextEmailStatus, processing_attempts: delivery.email_status === "sent" ? 0 : 1 }).eq("id", delivery.id).neq("email_status", "sent")
    if (activateError) throw activateError
    await admin.from("technical_notification_audit_logs").insert({ notification_id: notification.id, action: "triggered", metadata: { occurrence_key: occurrenceKey, delivery_id: delivery.id, tolerance_ms: PROCESSOR_TOLERANCE_MS } })
    processed = true

    if (wantsEmail && delivery.email_status !== "sent") {
      const sent = await invokeEmail(url, key, delivery.id)
      emailFailed = emailFailed || !sent
    }

    const next = calculateNextOccurrence(notification.schedule_type, occurrence, notification.recurrence_config)
    if (!next) {
      const { error } = await admin.from("technical_notifications").update({ status: "completed", last_run_at: new Date().toISOString(), next_run_at: null }).eq("id", notification.id).in("status", ["scheduled", "active"])
      if (error) throw error
      break
    }
    occurrence = next
    catchUp += 1
    const { error: updateError } = await admin.from("technical_notifications").update({ status: "scheduled", last_run_at: new Date().toISOString(), next_run_at: occurrence.toISOString() }).eq("id", notification.id).in("status", ["scheduled", "active"])
    if (updateError) throw updateError
  }
  return { processed, emailFailed }
}

serve(async req => {
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers })
  try {
    const { admin, url, key } = serviceClient()
    if (req.headers.get("Authorization") !== `Bearer ${key}`) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers })
    const body = await req.json().catch(() => ({})) as { delivery_id?: string }
    if (body.delivery_id) {
      const sent = await invokeEmail(url, key, body.delivery_id)
      return new Response(JSON.stringify({ delivery_id: body.delivery_id, status: sent ? "sent" : "failed" }), { status: sent ? 200 : 500, headers })
    }

    const now = new Date()
    const dueLimit = new Date(now.getTime() + PROCESSOR_TOLERANCE_MS).toISOString()
    const [{ data: byNext, error: nextError }, { data: byScheduled, error: scheduledError }] = await Promise.all([
      admin.from("technical_notifications").select("id, title, description, status, schedule_type, scheduled_at, next_run_at, recurrence_config").in("status", ["scheduled", "active"]).is("deleted_at", null).not("next_run_at", "is", null).lte("next_run_at", dueLimit),
      admin.from("technical_notifications").select("id, title, description, status, schedule_type, scheduled_at, next_run_at, recurrence_config").in("status", ["scheduled", "active"]).is("deleted_at", null).is("next_run_at", null).lte("scheduled_at", dueLimit),
    ])
    if (nextError) throw nextError
    if (scheduledError) throw scheduledError
    const unique = new Map<string, NotificationRow>()
    ;[...(byNext || []), ...(byScheduled || [])].forEach(notification => unique.set(notification.id, notification as NotificationRow))
    let processed = 0
    let emailFailures = 0
    const errors: string[] = []
    for (const notification of unique.values()) {
      try {
        const result = await processOne(admin, url, key, notification, now)
        if (result.processed) processed += 1
        if (result.emailFailed) emailFailures += 1
      } catch (error) {
        errors.push(`${notification.id}: ${error instanceof Error ? error.message : "erro desconhecido"}`)
        await admin.from("technical_notifications").update({ status: "failed" }).eq("id", notification.id).in("status", ["scheduled", "active"])
      }
    }
    return new Response(JSON.stringify({ processed, emailFailures, errors, checked_at: now.toISOString(), tolerance_ms: PROCESSOR_TOLERANCE_MS }), { status: 200, headers })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }), { status: 500, headers })
  }
})
