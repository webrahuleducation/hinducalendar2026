// Export all services for easy importing
export { eventService } from "./eventService";
export type { CustomEvent, CreateEventInput, UpdateEventInput } from "./eventService";

export { profileService } from "./profileService";
export type { Profile, UpdateProfileInput } from "./profileService";

export { reminderService } from "./reminderService";
export type { EventReminder, CreateReminderInput } from "./reminderService";

export { predefinedEventService } from "./predefinedEventService";
export type { PredefinedEventFilters } from "./predefinedEventService";
