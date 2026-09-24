import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { toBrasiliaFixedOffsetIso } from "@/utils/notificationDateUtils";

export type TechnicalNotification = Database["public"]["Tables"]["technical_notifications"]["Row"];
export type TechnicalNotificationProcess = Pick<Database["public"]["Tables"]["technical_notification_processes"]["Row"], "notification_id" | "process_id">;
export type TechnicalNotificationRecipient = Database["public"]["Tables"]["technical_notification_email_recipients"]["Row"];
export type TechnicalNotificationDelivery = Database["public"]["Tables"]["technical_notification_deliveries"]["Row"];

export interface NotificationProcess {
  id: number;
  process_number: string;
  object: string;
  municipality: string;
  status: string;
}

export interface TechnicalNotificationListItem extends TechnicalNotification {
  processes: NotificationProcess[];
  recipients: TechnicalNotificationRecipient[];
  delivery: TechnicalNotificationDelivery | null;
}

export interface NotificationFormValues {
  title: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  scheduleType: string;
  recurrenceConfig: Record<string, Json | undefined> | null;
  processIds: number[];
  recipients: Array<{ email: string; name: string }>;
}

const queryKey = ["technical-notifications"];

function toJsonObject(config: Record<string, Json | undefined> | null): Json | null {
  if (!config) return null;
  return Object.fromEntries(Object.entries(config).filter(([, value]) => value !== undefined)) as Json;
}

async function replaceRelations(notificationId: string, values: NotificationFormValues) {
  const { error: processDeleteError } = await supabase.from("technical_notification_processes").delete().eq("notification_id", notificationId);
  if (processDeleteError) throw processDeleteError;
  if (values.processIds.length > 0) {
    const { error } = await supabase.from("technical_notification_processes").insert(values.processIds.map(processId => ({ notification_id: notificationId, process_id: processId })));
    if (error) throw error;
  }

  const { error: recipientDeleteError } = await supabase.from("technical_notification_email_recipients").delete().eq("notification_id", notificationId);
  if (recipientDeleteError) throw recipientDeleteError;
  const recipients = values.recipients.map(recipient => ({ notification_id: notificationId, email: recipient.email.trim().toLowerCase(), name: recipient.name.trim() || null }));
  if (recipients.length > 0) {
    const { error } = await supabase.from("technical_notification_email_recipients").insert(recipients);
    if (error) throw error;
  }
}

export function useTechnicalNotifications() {
  const queryClient = useQueryClient();
  const processesQuery = useQuery({
    queryKey: ["technical-notification-processes"],
    queryFn: async (): Promise<NotificationProcess[]> => {
      const { data, error } = await supabase.from("processes").select("id, process_number, object, municipalities(name), status_processos(nome)").order("process_number");
      if (error) throw error;
      return (data || []).map(process => ({ id: process.id, process_number: process.process_number, object: process.object, municipality: process.municipalities?.name || "Não definido", status: process.status_processos?.nome || "Não definido" }));
    },
  });
  const listQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<TechnicalNotificationListItem[]> => {
      const [{ data: notifications, error: notificationsError }, { data: links, error: linksError }, { data: recipients, error: recipientsError }, { data: deliveries, error: deliveriesError }, { data: processes, error: processesError }] = await Promise.all([
        supabase.from("technical_notifications").select("*").order("next_run_at", { ascending: true, nullsFirst: false }),
        supabase.from("technical_notification_processes").select("notification_id, process_id"),
        supabase.from("technical_notification_email_recipients").select("*"),
        supabase.from("technical_notification_deliveries").select("*").order("scheduled_for", { ascending: false }),
        supabase.from("processes").select("id, process_number, object, municipalities(name), status_processos(nome)"),
      ]);
      if (notificationsError) throw notificationsError;
      if (linksError) throw linksError;
      if (recipientsError) throw recipientsError;
      if (deliveriesError) throw deliveriesError;
      if (processesError) throw processesError;

      const processMap = new Map<number, NotificationProcess>((processes || []).map(process => [process.id, {
        id: process.id,
        process_number: process.process_number,
        object: process.object,
        municipality: process.municipalities?.name || "Não definido",
        status: process.status_processos?.nome || "Não definido",
      }]));
      const linksByNotification = new Map<string, number[]>();
      (links || []).forEach(link => linksByNotification.set(link.notification_id, [...(linksByNotification.get(link.notification_id) || []), link.process_id]));
      const recipientsByNotification = new Map<string, TechnicalNotificationRecipient[]>();
      (recipients || []).forEach(recipient => recipientsByNotification.set(recipient.notification_id, [...(recipientsByNotification.get(recipient.notification_id) || []), recipient]));
      const deliveryByNotification = new Map<string, TechnicalNotificationDelivery>();
      (deliveries || []).forEach(delivery => { if (!deliveryByNotification.has(delivery.notification_id)) deliveryByNotification.set(delivery.notification_id, delivery); });

      return (notifications || []).map(notification => ({
        ...notification,
        processes: (linksByNotification.get(notification.id) || []).map(processId => processMap.get(processId)).filter((process): process is NotificationProcess => Boolean(process)),
        recipients: recipientsByNotification.get(notification.id) || [],
        delivery: deliveryByNotification.get(notification.id) || null,
      }));
    },
    refetchInterval: 60000,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ values, userId, notificationId }: { values: NotificationFormValues; userId: string; notificationId?: string }) => {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        scheduled_at: toBrasiliaFixedOffsetIso(values.scheduledDate, values.scheduledTime) as string,
        next_run_at: toBrasiliaFixedOffsetIso(values.scheduledDate, values.scheduledTime) as string,
        schedule_type: values.scheduleType,
        recurrence_config: toJsonObject(values.recurrenceConfig),
        created_by: userId,
        status: "scheduled",
        timezone: "Etc/GMT+3",
      };
      let id = notificationId;
      if (notificationId) {
        const { error } = await supabase.from("technical_notifications").update(payload).eq("id", notificationId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("technical_notifications").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      await replaceRelations(id as string, values);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "paused" | "cancelled" }) => {
      const { error } = await supabase.from("technical_notifications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, userId, reason }: { id: string; userId: string; reason: string }) => {
      const { error: markDeletedError } = await supabase.from("technical_notifications").update({ deleted_at: new Date().toISOString(), deleted_by: userId, delete_reason: reason, status: "deleted" }).eq("id", id);
      if (markDeletedError) throw markDeletedError;
      const { error: deleteError } = await supabase.from("technical_notifications").delete().eq("id", id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...listQuery, availableProcesses: processesQuery.data || [], saveMutation, statusMutation, deleteMutation };
}

