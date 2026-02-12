import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Clock, Bell, Tag, AlertCircle } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { eventService } from "@/services/eventService";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTimeFormat } from "@/contexts/TimeFormatContext";

const eventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().optional(),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
  category: z.enum(["personal", "family", "community"]),
  reminder_enabled: z.boolean(),
  reminder_time: z.string(),
}).refine(
  (data) => {
    if (data.reminder_enabled && (!data.time || data.time.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "Time is required when reminder is enabled",
    path: ["time"],
  }
);

type EventFormValues = z.infer<typeof eventSchema>;

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { formatTime } = useTimeFormat();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialDate = searchParams.get("date");

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      date: initialDate ? parseISO(initialDate) : undefined,
      time: "",
      description: "",
      category: "personal",
      reminder_enabled: false,
      reminder_time: "1_day_before",
    },
  });

  const onSubmit = async (values: EventFormValues) => {
    if (!user) {
      toast({ title: t("events.signInRequired"), variant: "destructive" });
      navigate("/auth");
      return;
    }
    setIsSubmitting(true);
    try {
      await eventService.createCustomEvent(user.id, {
        title: values.title,
        date: format(values.date, "yyyy-MM-dd"),
        time: values.time || undefined,
        description: values.description || undefined,
        category: values.category,
        reminder_enabled: values.reminder_enabled,
        reminder_time: values.reminder_time,
      });
      toast({ title: t("events.create"), description: t("common.success") });
      navigate("/events");
    } catch (error) {
      console.error("Error creating event:", error);
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reminderEnabled = form.watch("reminder_enabled");
  const watchedTime = form.watch("time");
  const watchedDate = form.watch("date");
  const watchedReminderTime = form.watch("reminder_time");

  const getReminderPreview = () => {
    if (!reminderEnabled || !watchedDate || !watchedTime) return null;
    const dateStr = format(watchedDate, "d MMM yyyy");
    const timeStr = formatTime(watchedTime);
    const reminderLabel = {
      same_day: t("reminder.sameDay"),
      "1_day_before": t("reminder.1DayBefore"),
      "2_days_before": t("reminder.2DaysBefore"),
      "1_week_before": t("reminder.1WeekBefore"),
    }[watchedReminderTime] || watchedReminderTime;
    return `${reminderLabel} — ${dateStr} ${t("reminder.at")} ${timeStr}`;
  };

  return (
    <AppLayout title={t("events.create")} showBack showNav={false}>
      <div className="p-4 pb-20">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("events.title")}</FormLabel>
                <FormControl><Input placeholder={t("events.title")} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("events.date")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>{t("events.date")}</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="time" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {reminderEnabled ? (
                    <span className="text-destructive">{t("events.time")} *</span>
                  ) : (
                    t("events.timeOptional")
                  )}
                </FormLabel>
                <FormControl><Input type="time" {...field} /></FormControl>
                {reminderEnabled && !watchedTime && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{t("reminder.timeRequired")}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" />{t("events.category")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="personal">{t("events.personal")}</SelectItem>
                    <SelectItem value="family">{t("events.family")}</SelectItem>
                    <SelectItem value="community">{t("events.community")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("events.descriptionOptional")}</FormLabel>
                <FormControl><Textarea placeholder={t("events.description")} className="resize-none" rows={4} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
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
                  <FormItem>
                    <FormLabel>{t("reminder.remindMe")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t("reminder.selectTime")} /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="same_day">{t("reminder.sameDay")}</SelectItem>
                        <SelectItem value="1_day_before">{t("reminder.1DayBefore")}</SelectItem>
                        <SelectItem value="2_days_before">{t("reminder.2DaysBefore")}</SelectItem>
                        <SelectItem value="1_week_before">{t("reminder.1WeekBefore")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Reminder Preview */}
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
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                {t("events.cancel")}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? t("events.creating") : t("events.create")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
