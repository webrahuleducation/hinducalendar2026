import { openDB, DBSchema, IDBPDatabase } from "idb";
import { CalendarEvent } from "@/types/calendar";

interface HinduCalendarDB extends DBSchema {
  events: {
    key: string;
    value: CalendarEvent;
    indexes: { "by-date": string; "by-type": string };
  };
  customEvents: {
    key: string;
    value: {
      id: string;
      user_id: string;
      title: string;
      date: string;
      time: string | null;
      description: string | null;
      category: string;
      reminder_enabled: boolean;
      reminder_time: string;
      created_at: string;
      updated_at: string;
      synced: boolean;
    };
    indexes: { "by-date": string; "by-user": string };
  };
  pendingSync: {
    key: string;
    value: {
      id: string;
      action: "create" | "update" | "delete";
      data: unknown;
      timestamp: number;
    };
  };
  appState: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = "hindu-calendar-2026";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<HinduCalendarDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<HinduCalendarDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<HinduCalendarDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Events store
      if (!db.objectStoreNames.contains("events")) {
        const eventStore = db.createObjectStore("events", { keyPath: "id" });
        eventStore.createIndex("by-date", "date");
        eventStore.createIndex("by-type", "type");
      }

      // Custom events store
      if (!db.objectStoreNames.contains("customEvents")) {
        const customStore = db.createObjectStore("customEvents", { keyPath: "id" });
        customStore.createIndex("by-date", "date");
        customStore.createIndex("by-user", "user_id");
      }

      // Pending sync store for offline changes
      if (!db.objectStoreNames.contains("pendingSync")) {
        db.createObjectStore("pendingSync", { keyPath: "id" });
      }

      // App state store
      if (!db.objectStoreNames.contains("appState")) {
        db.createObjectStore("appState");
      }
    },
  });

  return dbInstance;
}

// Event caching functions
export async function cacheEvents(events: CalendarEvent[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("events", "readwrite");
  
  await Promise.all([
    ...events.map((event) => tx.store.put(event)),
    tx.done,
  ]);
}

export async function getCachedEvents(): Promise<CalendarEvent[]> {
  const db = await getDB();
  return db.getAll("events");
}

export async function getCachedEventsByDate(date: string): Promise<CalendarEvent[]> {
  const db = await getDB();
  return db.getAllFromIndex("events", "by-date", date);
}

export async function getCachedEventsByType(type: "vrat" | "utsav"): Promise<CalendarEvent[]> {
  const db = await getDB();
  return db.getAllFromIndex("events", "by-type", type);
}

// Custom event offline functions
export async function cacheCustomEvent(event: HinduCalendarDB["customEvents"]["value"]): Promise<void> {
  const db = await getDB();
  await db.put("customEvents", event);
}

export async function getCachedCustomEvents(userId: string): Promise<HinduCalendarDB["customEvents"]["value"][]> {
  const db = await getDB();
  return db.getAllFromIndex("customEvents", "by-user", userId);
}

export async function deleteCachedCustomEvent(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("customEvents", id);
}

// Pending sync for offline changes
export async function addPendingSync(
  action: "create" | "update" | "delete",
  data: unknown
): Promise<void> {
  const db = await getDB();
  const id = `${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.put("pendingSync", {
    id,
    action,
    data,
    timestamp: Date.now(),
  });
}

export async function getPendingSyncs(): Promise<HinduCalendarDB["pendingSync"]["value"][]> {
  const db = await getDB();
  return db.getAll("pendingSync");
}

export async function clearPendingSync(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("pendingSync", id);
}

export async function clearAllPendingSyncs(): Promise<void> {
  const db = await getDB();
  await db.clear("pendingSync");
}

// App state persistence
export async function setAppState<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put("appState", value, key);
}

export async function getAppState<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get("appState", key) as Promise<T | undefined>;
}

// Check if we're online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Sync pending changes when back online
export async function syncPendingChanges(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingSyncs();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      // Here you would implement actual sync logic with Supabase
      // For now, we'll just mark as synced
      await clearPendingSync(item.id);
      synced++;
    } catch (error) {
      console.error("Failed to sync:", item, error);
      failed++;
    }
  }

  return { synced, failed };
}
