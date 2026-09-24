import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Bell, CheckCircle, Clock, Info, Mail, PauseCircle, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { parseBrasiliaFixedOffsetDate } from "@/utils/notificationDateUtils";

interface TechnicalBellItem {
  id: string;
  title: string;
  description: string;
  scheduleType: string;
  notificationId: string;
  occurrenceKey: string;
  scheduledFor: string;
  emailStatus: string;
  emailSentAt: string | null;
  processCount: number;
  readAt: string | null;
  snoozedUntil: string | null;
}

function brasiliaDateString(offsetDays: number) {
  const date = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Etc/GMT+3", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data inválida" : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function toBrasiliaIso(value: string) {
  return parseBrasiliaFixedOffsetDate(value.slice(0, 10), value.slice(11, 16))?.toISOString() || new Date().toISOString();
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<TechnicalBellItem | null>(null);
  const [customSnooze, setCustomSnooze] = useState("");
  const { isTechnical, user } = useAuth();
  const { toast } = useToast();
  const seenOccurrences = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const legacyQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      await supabase.rpc("create_expiration_notifications");
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: isTechnical,
    refetchInterval: 60000,
  });

  const technicalQuery = useQuery({
    queryKey: ["technical-notification-bell", user?.id],
    queryFn: async (): Promise<TechnicalBellItem[]> => {
      const [{ data: notifications, error: notificationsError }, { data: deliveries, error: deliveriesError }, { data: states, error: statesError }, { data: links, error: linksError }] = await Promise.all([
        supabase.from("technical_notifications").select("id, title, description, schedule_type"),
        supabase.from("technical_notification_deliveries").select("id, notification_id, occurrence_key, scheduled_for, email_status, email_sent_at, in_app_delivered").eq("in_app_delivered", true).order("scheduled_for", { ascending: false }).limit(50),
        supabase.from("technical_notification_user_states").select("notification_id, occurrence_key, read_at, snoozed_until").eq("user_id", user?.id || "00000000-0000-0000-0000-000000000000"),
        supabase.from("technical_notification_processes").select("notification_id"),
      ]);
      if (notificationsError) throw notificationsError;
      if (deliveriesError) throw deliveriesError;
      if (statesError) throw statesError;
      if (linksError) throw linksError;
      const notificationMap = new Map((notifications || []).map(notification => [notification.id, notification]));
      const stateMap = new Map((states || []).map(state => [`${state.notification_id}:${state.occurrence_key}`, state]));
      const processCountMap = new Map<string, number>();
      (links || []).forEach(link => processCountMap.set(link.notification_id, (processCountMap.get(link.notification_id) || 0) + 1));
      return (deliveries || []).flatMap(delivery => {
        const notification = notificationMap.get(delivery.notification_id);
        if (!notification) return [];
        const state = stateMap.get(`${delivery.notification_id}:${delivery.occurrence_key}`);
        return [{ id: delivery.id, title: notification.title, description: notification.description, scheduleType: notification.schedule_type, notificationId: delivery.notification_id, occurrenceKey: delivery.occurrence_key, scheduledFor: delivery.scheduled_for, emailStatus: delivery.email_status, emailSentAt: delivery.email_sent_at, processCount: processCountMap.get(delivery.notification_id) || 0, readAt: state?.read_at || null, snoozedUntil: state?.snoozed_until || null }];
      });
    },
    enabled: isTechnical && Boolean(user?.id),
    refetchInterval: 30000,
  });

  const technicalPending = useMemo(() => (technicalQuery.data || []).filter(item => !item.readAt && (!item.snoozedUntil || new Date(item.snoozedUntil).getTime() <= Date.now())), [technicalQuery.data]);
  const legacyPending = (legacyQuery.data || []).filter(notification => !notification.is_read);
  const unreadCount = technicalPending.length + legacyPending.length;

  useEffect(() => {
    if (!isTechnical || !technicalQuery.data) return;
    if (!initialized.current) {
      technicalQuery.data.forEach(item => seenOccurrences.current.add(`${item.notificationId}:${item.occurrenceKey}`));
      initialized.current = true;
      return;
    }
    technicalPending.forEach(item => {
      const key = `${item.notificationId}:${item.occurrenceKey}`;
      if (seenOccurrences.current.has(key)) return;
      seenOccurrences.current.add(key);
      toast({ title: item.title, description: item.description });
    });
  }, [isTechnical, technicalPending, technicalQuery.data, toast]);

  const markTechnicalRead = async (item: TechnicalBellItem) => {
    if (!user) return;
    const { error } = await supabase.from("technical_notification_user_states").upsert({ notification_id: item.notificationId, occurrence_key: item.occurrenceKey, user_id: user.id, read_at: new Date().toISOString() }, { onConflict: "notification_id,occurrence_key,user_id" });
    if (error) { toast({ title: "Erro ao marcar como lida", description: error.message, variant: "destructive" }); return; }
    await technicalQuery.refetch();
  };

  const snooze = async (item: TechnicalBellItem, until: string) => {
    if (!user) return;
    const { error } = await supabase.from("technical_notification_user_states").upsert({ notification_id: item.notificationId, occurrence_key: item.occurrenceKey, user_id: user.id, snoozed_until: until }, { onConflict: "notification_id,occurrence_key,user_id" });
    if (error) { toast({ title: "Erro ao adiar", description: error.message, variant: "destructive" }); return; }
    await technicalQuery.refetch();
  };

  const markLegacyRead = async (id: number) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) toast({ title: "Erro ao marcar como lida", description: error.message, variant: "destructive" });
    else await legacyQuery.refetch();
  };

  if (!isTechnical) return null;
  return <div className="relative"><Button variant="ghost" size="sm" onClick={() => setIsOpen(open => !open)} className="relative" aria-label={`Notificações técnicas: ${unreadCount} não lidas`}><Bell className="h-4 w-4" />{unreadCount > 0 && <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">{unreadCount}</Badge>}</Button>{isOpen && <Card className="absolute right-0 top-full z-50 mt-2 w-[min(28rem,calc(100vw-2rem))] shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Notificações</CardTitle><Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Fechar"><X /></Button></CardHeader><CardContent className="max-h-[min(32rem,70vh)] overflow-y-auto space-y-2">{legacyQuery.isLoading || technicalQuery.isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : <>{technicalPending.map(item => <div key={`${item.notificationId}:${item.occurrenceKey}`} className="rounded border bg-card p-3 text-sm"><div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><div className="min-w-0 flex-1"><p className="font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(item.scheduledFor)} · {item.processCount} processo(s)</p><div className="mt-2 flex flex-wrap gap-1"><Button size="sm" variant="ghost" onClick={() => setSelected(item)}>Ver detalhes</Button><Button size="sm" variant="ghost" onClick={() => void markTechnicalRead(item)}><CheckCircle /> Lida</Button><Popover><PopoverTrigger asChild><Button size="sm" variant="ghost"><PauseCircle /> Adiar</Button></PopoverTrigger><PopoverContent className="w-64 space-y-2"><Button className="w-full justify-start" variant="outline" onClick={() => void snooze(item, new Date(Date.now() + 3600000).toISOString())}>1 hora</Button><Button className="w-full justify-start" variant="outline" onClick={() => void snooze(item, `${brasiliaDateString(1)}T12:00:00-03:00`)}>Amanhã</Button><Button className="w-full justify-start" variant="outline" onClick={() => void snooze(item, `${brasiliaDateString(7)}T09:00:00-03:00`)}>Próxima semana</Button><Input type="datetime-local" value={customSnooze} onChange={event => setCustomSnooze(event.target.value)} /><Button className="w-full" disabled={!customSnooze} onClick={() => { void snooze(item, toBrasiliaIso(customSnooze)); setCustomSnooze(""); }}>Escolher data e horário</Button></PopoverContent></Popover>{item.emailStatus !== "not_requested" && <Badge variant="outline"><Mail className="mr-1 h-3 w-3" />{item.emailStatus === "sent" ? "E-mail enviado" : "E-mail pendente"}</Badge>}</div></div></div></div>)}{legacyPending.map(notification => <div key={notification.id} className="rounded border bg-muted/30 p-3 text-sm"><div className="flex gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><div className="min-w-0 flex-1"><p className="font-medium">Alerta de vencimento</p><p className="text-xs text-muted-foreground">{notification.message}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(notification.created_at)}</p></div>{!notification.is_read && <Button size="icon" variant="ghost" onClick={() => void markLegacyRead(notification.id)} aria-label="Marcar alerta como lido"><CheckCircle /></Button>}</div></div>)}{technicalPending.length === 0 && legacyPending.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma notificação pendente.</p>}</>}</CardContent></Card>}<Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent><DialogHeader><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>{selected?.description}</DialogDescription></DialogHeader>{selected && <div className="space-y-2 text-sm"><p><Clock className="mr-1 inline h-4 w-4" />Ocorrência: {formatDate(selected.scheduledFor)}</p><p>Tipo: {selected.scheduleType === "once" ? "Uma única vez" : "Recorrente"}</p><p>Processos relacionados: {selected.processCount || "Nenhum"}</p>{selected.emailStatus !== "not_requested" && <p><Mail className="mr-1 inline h-4 w-4" />E-mail: {selected.emailStatus}</p>}</div>}</DialogContent></Dialog></div>;
}
