import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Clock, Bell, Tag, Trash2, Edit2 } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { eventService, CustomEvent } from "@/services/eventService";
import { useToast } from "@/hooks/use-toast";

const eventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().optional(),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
  category: z.enum(["personal", "family", "community"]),
  reminder_enabled: z.boolean(),
  reminder_time: z.string(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<CustomEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      date: undefined,
      time: "",
      description: "",
      category: "personal",
      reminder_enabled: false,
      reminder_time: "1_day_before",
    },
  });

  useEffect(() => {
    if (id && user) {
      loadEvent();
    }
  }, [id, user]);

  const loadEvent = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await eventService.getCustomEvent(id);
      if (data) {
        setEvent(data);
        form.reset({
          title: data.title,
          date: parseISO(data.date),
          time: data.time || "",
          description: data.description || "",
          category: data.category,
          reminder_enabled: data.reminder_enabled,
          reminder_time: data.reminder_time,
        });
      }
    } catch (error) {
      console.error("Error loading event:", error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: EventFormValues) => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      await eventService.updateCustomEvent({
        id,
        title: values.title,
        date: format(values.date, "yyyy-MM-dd"),
        time: values.time || undefined,
        description: values.description || undefined,
        category: values.category,
        reminder_enabled: values.reminder_enabled,
        reminder_time: values.reminder_time,
      });

      toast({
        title: "Event updated",
        description: "Your changes have been saved",
      });

      setIsEditing(false);
      loadEvent();
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      await eventService.deleteCustomEvent(id);
      toast({
        title: "Event deleted",
        description: "The event has been removed",
      });
      navigate("/events");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const reminderEnabled = form.watch("reminder_enabled");

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "family": return "Family";
      case "community": return "Community";
      default: return "Personal";
    }
  };

  if (loading) {
    return (
      <AppLayout title="Event Details" showBack>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout title="Event Details" showBack>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Event not found</p>
          <Button onClick={() => navigate("/events")} className="mt-4">
            Back to Events
          </Button>
        </div>
      </AppLayout>
    );
  }

  const headerRight = !isEditing ? (
    <div className="flex gap-2">
      <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
        <Edit2 className="h-5 w-5" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="h-5 w-5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ) : null;

  return (
    <AppLayout 
      title={isEditing ? "Edit Event" : "Event Details"} 
      showBack
      headerRight={headerRight}
    >
      <div className="p-4 pb-20">
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time */}
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Category
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="community">Community</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add event details..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reminder Toggle */}
              <FormField
                control={form.control}
                name="reminder_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Bell className="h-4 w-4" />
                        Enable Reminder
                      </FormLabel>
                      <FormDescription>
                        Get notified before the event
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Reminder Time */}
              {reminderEnabled && (
                <FormField
                  control={form.control}
                  name="reminder_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remind me</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reminder time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="same_day">On the day</SelectItem>
                          <SelectItem value="1_day_before">1 day before</SelectItem>
                          <SelectItem value="2_days_before">2 days before</SelectItem>
                          <SelectItem value="1_week_before">1 week before</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsEditing(false);
                    loadEvent();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            {/* Event Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "mb-2",
                        event.category === "family" && "bg-secondary/10 text-secondary border-secondary/30",
                        event.category === "community" && "bg-accent/10 text-accent border-accent/30",
                        event.category === "personal" && "bg-primary/10 text-primary border-primary/30"
                      )}
                    >
                      {getCategoryLabel(event.category)}
                    </Badge>
                    <CardTitle className="font-display text-xl">
                      {event.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date */}
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CalendarIcon className="h-5 w-5" />
                  <span>{format(parseISO(event.date), "EEEE, d MMMM yyyy")}</span>
                </div>

                {/* Time */}
                {event.time && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span>{event.time}</span>
                  </div>
                )}

                {/* Reminder */}
                {event.reminder_enabled && (
                  <div className="flex items-center gap-3 text-accent">
                    <Bell className="h-5 w-5" />
                    <span>Reminder set</span>
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <div className="pt-4 border-t">
                    <p className="text-foreground">{event.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Button */}
            <Button 
              onClick={() => setIsEditing(true)} 
              className="w-full gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit Event
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
