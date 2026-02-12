import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Clock, Bell, Tag, Trash2, Edit2, AlertCircle } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { eventService, CustomEvent } from "@/services/eventService";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTimeFormat } from "@/contexts/TimeFormatContext";

const eventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().optional(),
  description: z.string().trim().max(500).optional(),
  category: z.enum(["personal", "family", "community"]),
  reminder_enabled: z.boolean(),
  reminder_time: z.string(),
}).refine(
  (data) => !(data.reminder_enabled && (!data.time || data.time.trim() === "")),
  { message: "Time is required when reminder is enabled", path: ["time"] }
);

type EventFormValues = z.infer<typeof eventSchema>;

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { formatTime } = useTimeFormat();

  const [event, setEvent] = useState<CustomEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "", date: undefined, time: "", description: "",
      category: "personal", reminder_enabled: false, reminder_time: "1_day_before",
    },
  });

  useEffect(() => { if (id && user) loadEvent(); }, [id, user]);

  const loadEvent = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await eventService.getCustomEvent(id);
      if (data) {
        setEvent(data);
        form.reset({
          title: data.title, date: parseISO(data.date), time: data.time || "",
          description: data.description || "", category: data.category,
          reminder_enabled: data.reminder_enabled, reminder_time: data.reminder_time,
        });
      }
    } catch (error) {
      console.error("Error loading event:", error);
      toast({ title: t("common.error"), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const onSubmit = async (values: EventFormValues) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await eventService.updateCustomEvent({
        id, title: values.title, date: format(values.date, "yyyy-MM-dd"),
        time: values.time || undefined, description: values.description || undefined,
        category: values.category, reminder_enabled: values.reminder_enabled,
        reminder_time: values.reminder_time,
      });
      toast({ title: t("events.save"), description: t("common.success") });
      setIsEditing(false);
      loadEvent();
    } catch (error) {
      console.error("Error updating event:", error);
      toast({ title: t("common.error"), variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await eventService.deleteCustomEvent(id);
      toast({ title: t("events.deleteConfirm") });
      navigate("/events");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({ title: t("common.error"), variant: "destructive" });
    } finally { setIsDeleting(false); }
  };

  const reminderEnabled = form.watch("reminder_enabled");
  const watchedTime = form.watch("time");
  const watchedDate = form.watch("date");
  const watchedReminderTime = form.watch("reminder_time");

  const getReminderPreview = () => {
    if (!reminderEnabled || !watchedDate || !watchedTime) return null;
    const dateStr = format(watchedDate, "d MMM yyyy");
    const timeStr = formatTime(watchedTime);
    const label = {
      same_day: t("reminder.sameDay"), "1_day_before": t("reminder.1DayBefore"),
      "2_days_before": t("reminder.2DaysBefore"), "1_week_before": t("reminder.1WeekBefore"),
    }[watchedReminderTime] || watchedReminderTime;
    return `${label} — ${dateStr} ${t("reminder.at")} ${timeStr}`;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "family": return t("events.family");
      case "community": return t("events.community");
      default: return t("events.personal");
    }
  };

  if (loading) {
    return (
      <AppLayout title={t("events.edit")} showBack>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout title={t("events.edit")} showBack>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">{t("common.notFound")}</p>
          <Button onClick={() => navigate("/events")} className="mt-4">{t("common.back")}</Button>
        </div>
      </AppLayout>
    );
  }

  const headerRight = !isEditing ? (
    <div className="flex gap-2">
      <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}><Edit2 className="h-5 w-5" /></Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-5 w-5" /></Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("events.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("events.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("events.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? t("common.loading") : t("events.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ) : null;

  return (
    <AppLayout title={isEditing ? t("events.edit") : t("events.edit")} showBack headerRight={headerRight}>
      <div className="p-4 pb-20">
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>{t("events.title")}</FormLabel>
                  <FormControl><Input placeholder={t("events.title")} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>{t("events.date")}</FormLabel>
                  <Popover><PopoverTrigger asChild><FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP") : <span>{t("events.date")}</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button></FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="pointer-events-auto" />
                    </PopoverContent></Popover><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4" />
                  {reminderEnabled ? <span className="text-destructive">{t("events.time")} *</span> : t("events.timeOptional")}
                </FormLabel>
                  <FormControl><Input type="time" {...field} /></FormControl>
                  {reminderEnabled && !watchedTime && (
                    <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{t("reminder.timeRequired")}</p>
                  )}
                  <FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" />{t("events.category")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="personal">{t("events.personal")}</SelectItem>
                      <SelectItem value="family">{t("events.family")}</SelectItem>
                      <SelectItem value="community">{t("events.community")}</SelectItem>
                    </SelectContent></Select><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>{t("events.descriptionOptional")}</FormLabel>
                  <FormControl><Textarea placeholder={t("events.description")} className="resize-none" rows={4} {...field} /></FormControl>
                  <FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="reminder_enabled" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" />{t("reminder.enable")}</FormLabel>
                    <FormDescription>{t("reminder.getNotified")}</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              {reminderEnabled && (
                <>
                  <FormField control={form.control} name="reminder_time" render={({ field }) => (
                    <FormItem><FormLabel>{t("reminder.remindMe")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t("reminder.selectTime")} /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="same_day">{t("reminder.sameDay")}</SelectItem>
                          <SelectItem value="1_day_before">{t("reminder.1DayBefore")}</SelectItem>
                          <SelectItem value="2_days_before">{t("reminder.2DaysBefore")}</SelectItem>
                          <SelectItem value="1_week_before">{t("reminder.1WeekBefore")}</SelectItem>
                        </SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  {getReminderPreview() && (
                    <Card className="border-accent/30 bg-accent/5">
                      <CardContent className="p-3 flex items-center gap-2 text-sm">
                        <Bell className="h-4 w-4 text-accent shrink-0" />
                        <div>
                          <p className="font-medium text-accent">{t("reminder.preview")}</p>
                          <p className="text-muted-foreground">{getReminderPreview()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setIsEditing(false); loadEvent(); }}>
                  {t("events.cancel")}
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? t("events.saving") : t("events.save")}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="outline" className={cn("mb-2",
                      event.category === "family" && "bg-secondary/10 text-secondary border-secondary/30",
                      event.category === "community" && "bg-accent/10 text-accent border-accent/30",
                      event.category === "personal" && "bg-custom/10 text-custom border-custom/30"
                    )}>{getCategoryLabel(event.category)}</Badge>
                    <CardTitle className="font-display text-xl">{event.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CalendarIcon className="h-5 w-5" />
                  <span>{format(parseISO(event.date), "EEEE, d MMMM yyyy")}</span>
                </div>
                {event.time && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span>{formatTime(event.time)}</span>
                  </div>
                )}
                {event.reminder_enabled && (
                  <div className="flex items-center gap-3 text-accent">
                    <Bell className="h-5 w-5" />
                    <span>{t("reminder.set")}</span>
                  </div>
                )}
                {event.description && (
                  <div className="pt-4 border-t">
                    <p className="text-foreground">{event.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Button onClick={() => setIsEditing(true)} className="w-full gap-2">
              <Edit2 className="h-4 w-4" />{t("events.edit")}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
