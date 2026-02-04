
# Mobile-First Architecture Migration: Complete Task Breakdown

## Important Context

This plan covers the **external development work** required to transform the current React + Vite PWA into a mobile-first architecture. Since Lovable only supports React + Vite web apps, this migration must be executed in an external development environment (VS Code, Cursor, etc.) using:

- **pnpm** for monorepo workspace management
- **Expo CLI** for mobile development
- **EAS Build** for app store deployment
- **Next.js** for the secondary website

---

## Phase 1: Monorepo Setup and Shared Foundation
**Label: SHARED**
**Estimated Duration: 2-3 days**

### Task 1.1: Initialize Monorepo Structure

| Step | Action | Details |
|------|--------|---------|
| 1.1.1 | Create new project directory | `mkdir hindu-calendar-2026 && cd hindu-calendar-2026` |
| 1.1.2 | Initialize pnpm workspace | Create root `package.json` with `"workspaces": ["apps/*", "packages/*"]` |
| 1.1.3 | Create directory structure | `apps/mobile`, `apps/web`, `packages/shared` |
| 1.1.4 | Configure pnpm-workspace.yaml | Define workspace packages |
| 1.1.5 | Setup root TypeScript config | Base `tsconfig.json` extended by each app |

**Root package.json structure:**
```json
{
  "name": "hindu-calendar-2026",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "mobile": "pnpm --filter @hindu-calendar/mobile",
    "web": "pnpm --filter @hindu-calendar/web",
    "shared": "pnpm --filter @hindu-calendar/shared"
  }
}
```

### Task 1.2: Extract Types to Shared Package

| Current File | New Location | Status |
|--------------|--------------|--------|
| `src/types/calendar.ts` | `packages/shared/types/calendar.ts` | Move as-is (platform-agnostic) |

**Files to create in `packages/shared/types/`:**

| File | Contents |
|------|----------|
| `calendar.ts` | `EventType`, `CalendarEvent`, `CalendarDay`, `MonthData` |
| `profile.ts` | `Profile`, `UpdateProfileInput` (extract from profileService) |
| `event.ts` | `CustomEvent`, `CreateEventInput`, `UpdateEventInput` (extract from eventService) |
| `reminder.ts` | `EventReminder`, `CreateReminderInput` (extract from reminderService) |
| `index.ts` | Re-export all types |

### Task 1.3: Extract Utilities to Shared Package

| Current File | New Location | Browser API Dependencies |
|--------------|--------------|-------------------------|
| `src/utils/calendarUtils.ts` | `packages/shared/utils/calendarUtils.ts` | None (pure functions, safe to share) |

**Additional utilities to create:**

| File | Purpose |
|------|---------|
| `packages/shared/utils/dateHelpers.ts` | Common date-fns wrappers |
| `packages/shared/utils/eventFilters.ts` | Event filtering/searching logic |
| `packages/shared/utils/index.ts` | Re-export all utilities |

### Task 1.4: Extract Static Data to Shared Package

| Current File | New Location | Status |
|--------------|--------------|--------|
| `src/data/hinduEvents2026.ts` | `packages/shared/data/hinduEvents2026.ts` | Move as-is (pure data) |

**Note:** Remove the `@/types/calendar` import path alias and use relative imports or package imports.

### Task 1.5: Create Platform-Agnostic Supabase Client Factory

**Current implementation uses browser `localStorage`:**
```typescript
// Current: src/integrations/supabase/client.ts
auth: {
  storage: localStorage,  // Browser-only!
  persistSession: true,
  autoRefreshToken: true,
}
```

**New shared implementation:**

| File | Purpose |
|------|---------|
| `packages/shared/supabase/client.ts` | Factory function accepting storage adapter |
| `packages/shared/supabase/types.ts` | Copy of current `types.ts` |
| `packages/shared/supabase/index.ts` | Re-exports |

**Factory pattern:**
```typescript
// packages/shared/supabase/client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://gpgtzebpzbkcjtuffluo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
}

export function createSupabaseClient(storage: StorageAdapter): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
```

### Task 1.6: Migrate Services to Shared Package

**Services analysis - what can be shared:**

| Current Service | Shareable | Platform-Specific Dependencies |
|-----------------|-----------|-------------------------------|
| `eventService.ts` | YES | None (pure Supabase calls) |
| `profileService.ts` | YES | None (pure Supabase calls) |
| `reminderService.ts` | YES | None (pure Supabase calls) |
| `predefinedEventService.ts` | YES | None (uses static data) |
| `notificationService.ts` | NO | Uses `window.Notification`, `localStorage`, `navigator.serviceWorker` |
| `shareService.ts` | PARTIAL | Uses `navigator.share`, `window.location`, `document.createElement` |

**Migration approach for shareable services:**

| File | Changes Required |
|------|------------------|
| `eventService.ts` | Accept Supabase client as parameter instead of importing |
| `profileService.ts` | Accept Supabase client as parameter |
| `reminderService.ts` | Accept Supabase client as parameter |
| `predefinedEventService.ts` | Move as-is (only uses static data) |

**Example refactored service:**
```typescript
// packages/shared/services/eventService.ts
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import type { CustomEvent, CreateEventInput } from '../types';

export function createEventService(supabase: SupabaseClient<Database>) {
  return {
    async getCustomEvents(userId: string): Promise<CustomEvent[]> {
      const { data, error } = await supabase
        .from("custom_events")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data || []) as CustomEvent[];
    },
    // ... other methods
  };
}
```

### Task 1.7: Create Shared Package Configuration

| File | Purpose |
|------|---------|
| `packages/shared/package.json` | Package config with dependencies |
| `packages/shared/tsconfig.json` | TypeScript config extending root |
| `packages/shared/index.ts` | Main entry point |

**package.json:**
```json
{
  "name": "@hindu-calendar/shared",
  "version": "1.0.0",
  "main": "index.ts",
  "dependencies": {
    "@supabase/supabase-js": "^2.90.0",
    "date-fns": "^3.6.0",
    "zod": "^3.25.76"
  }
}
```

---

## Phase 2: Expo Mobile App Scaffold
**Label: MOBILE-ONLY**
**Estimated Duration: 2-3 days**

### Task 2.1: Initialize Expo App

| Step | Command/Action |
|------|----------------|
| 2.1.1 | `cd apps && npx create-expo-app mobile --template tabs` |
| 2.1.2 | Configure `app.json` with app metadata |
| 2.1.3 | Setup `eas.json` for EAS Build |
| 2.1.4 | Install core dependencies |

**Key dependencies to install:**
```bash
pnpm add expo-router expo-secure-store @react-native-async-storage/async-storage
pnpm add nativewind tailwindcss
pnpm add @supabase/supabase-js
pnpm add @hindu-calendar/shared@workspace:*
```

### Task 2.2: Configure expo-router Navigation

**Route mapping from current web app:**

| Current Web Route | Expo Router Path | File Location |
|-------------------|------------------|---------------|
| `/` | `app/index.tsx` | Splash/redirect |
| `/auth` | `app/auth.tsx` | Auth screen |
| `/calendar` | `app/(tabs)/calendar.tsx` | Main calendar |
| `/day/:date` | `app/day/[date].tsx` | Day detail (modal) |
| `/library` | `app/(tabs)/library.tsx` | Event library |
| `/profile` | `app/(tabs)/profile.tsx` | User profile |
| `/events` | `app/(tabs)/events.tsx` | Custom events |
| `/event/new` | `app/event/new.tsx` | Create event |
| `/event/:id` | `app/event/[id].tsx` | Event detail |

### Task 2.3: Setup NativeWind (Tailwind for React Native)

| Step | Action |
|------|--------|
| 2.3.1 | Install NativeWind dependencies |
| 2.3.2 | Configure `tailwind.config.js` |
| 2.3.3 | Setup Babel preset |
| 2.3.4 | Create design tokens matching current theme |

**Design tokens to migrate:**

| Current Token | Value |
|---------------|-------|
| Primary color | `hsl(25 95% 53%)` (saffron/orange) |
| Secondary color | `hsl(47 100% 50%)` (golden yellow) |
| Background | `hsl(45 100% 98%)` (warm cream) |

### Task 2.4: Create Mobile Supabase Client

| File | Purpose |
|------|---------|
| `apps/mobile/lib/supabase.ts` | Mobile-specific client with AsyncStorage |

**Implementation:**
```typescript
// apps/mobile/lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSupabaseClient } from '@hindu-calendar/shared/supabase';

const storage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const supabase = createSupabaseClient(storage);
```

### Task 2.5: Configure EAS Build

**eas.json configuration:**
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

---

## Phase 3: Mobile Authentication
**Label: MOBILE-ONLY (uses SHARED services)**
**Estimated Duration: 2 days**

### Task 3.1: Setup Deep Linking

| Configuration | Value |
|---------------|-------|
| URL Scheme | `hindukalendar2026` |
| Callback URL | `hindukalendar2026://auth/callback` |

**app.json addition:**
```json
{
  "scheme": "hindukalendar2026",
  "android": {
    "intentFilters": [{
      "action": "VIEW",
      "data": [{ "scheme": "hindukalendar2026" }],
      "category": ["BROWSABLE", "DEFAULT"]
    }]
  }
}
```

### Task 3.2: Implement Mobile Auth Context

**Current browser auth uses:**
- `window.location.origin` for redirect
- Browser session via localStorage

**Mobile replacement:**
- `expo-auth-session` for OAuth flow
- `expo-secure-store` for token storage
- Deep linking for OAuth callback

### Task 3.3: Update Supabase Google OAuth Redirect

| Platform | Redirect URI |
|----------|--------------|
| Web (existing) | `https://gpgtzebpzbkcjtuffluo.supabase.co/auth/v1/callback` |
| Mobile (new) | `hindukalendar2026://auth/callback` |

**Note:** Add mobile redirect URI in Supabase Dashboard > Authentication > URL Configuration

---

## Phase 4: Mobile Notifications
**Label: MOBILE-ONLY**
**Estimated Duration: 2-3 days**

### Task 4.1: Database Migration for Push Tokens

**New table required:**
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- RLS policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);
```

### Task 4.2: Create Mobile Notification Service

**Replace current `notificationService.ts` with:**

| File | Purpose |
|------|---------|
| `apps/mobile/services/notificationService.ts` | expo-notifications wrapper |

**Key differences:**
| Web (current) | Mobile (new) |
|---------------|--------------|
| `Notification.requestPermission()` | `Notifications.requestPermissionsAsync()` |
| `navigator.serviceWorker.showNotification()` | `Notifications.scheduleNotificationAsync()` |
| `localStorage` for scheduled | Local SQLite or Supabase |

### Task 4.3: Create Supabase Edge Function for Push

| File | Purpose |
|------|---------|
| `supabase/functions/send-push-notification/index.ts` | Send via Expo Push API |

**Edge function outline:**
```typescript
// Accepts: { userId, title, body, eventId, eventDate }
// Fetches push_tokens for user
// Sends via Expo Push API: https://exp.host/--/api/v2/push/send
```

---

## Phase 5: Mobile Offline and Storage
**Label: MOBILE-ONLY**
**Estimated Duration: 2 days**

### Task 5.1: Replace IndexedDB with AsyncStorage

**Current `offlineStorage.ts` uses:**
- `idb` library (IndexedDB)
- `navigator.onLine`

**Mobile replacement:**

| Current | Mobile Replacement |
|---------|-------------------|
| `idb` / IndexedDB | `@react-native-async-storage/async-storage` |
| `navigator.onLine` | `@react-native-community/netinfo` |

### Task 5.2: Create Mobile Offline Service

| File | Purpose |
|------|---------|
| `apps/mobile/services/offlineService.ts` | AsyncStorage-based caching |
| `apps/mobile/hooks/useOffline.ts` | NetInfo-based connectivity hook |

---

## Phase 6: Mobile UI Components
**Label: MOBILE-ONLY**
**Estimated Duration: 3-4 days**

### Task 6.1: Rebuild Core UI Components

**Components needing rebuild for React Native:**

| Web Component | Mobile Approach |
|---------------|-----------------|
| Calendar grid | `react-native-calendars` or custom View grid |
| Bottom navigation | `expo-router` tabs with custom styling |
| Cards/Badges | NativeWind styled View/Text |
| Modals/Sheets | `@gorhom/bottom-sheet` |
| Forms/Inputs | React Native TextInput + NativeWind |

### Task 6.2: Add Mobile-Specific Features

| Feature | Library |
|---------|---------|
| Haptic feedback | `expo-haptics` |
| Swipe gestures | `react-native-gesture-handler` |
| Image picker (avatars) | `expo-image-picker` |
| Share | `expo-sharing` |

---

## Phase 7: Next.js Website
**Label: WEB-ONLY**
**Estimated Duration: 2-3 days**

### Task 7.1: Initialize Next.js App

```bash
cd apps && npx create-next-app web --typescript --tailwind --app
```

### Task 7.2: Configure Shared Package Integration

| File | Changes |
|------|---------|
| `apps/web/lib/supabase.ts` | Browser client using localStorage (similar to current) |
| `next.config.js` | Configure `transpilePackages: ['@hindu-calendar/shared']` |

### Task 7.3: Implement Web-Only Features

| Feature | Purpose |
|---------|---------|
| SEO metadata | Search engine optimization |
| Sitemap generation | Event page indexing |
| App store links | Download CTAs |
| Read-only calendar | Public event browsing |

---

## Phase 8: Supabase Edge Functions for Scheduled Notifications
**Label: SHARED (backend)**
**Estimated Duration: 1-2 days**

### Task 8.1: Create Notification Scheduler Edge Function

| File | Purpose |
|------|---------|
| `supabase/functions/check-reminders/index.ts` | Cron-triggered reminder checker |

**Trigger options:**
- pg_cron for scheduled execution
- Or manual invocation from mobile app

---

## Phase 9: EAS Build and Deployment
**Label: MOBILE-ONLY**
**Estimated Duration: 2-3 days**

### Task 9.1: Android Build and Submission

| Step | Action |
|------|--------|
| 9.1.1 | Generate keystore via EAS |
| 9.1.2 | Build preview APK: `eas build --platform android --profile preview` |
| 9.1.3 | Test on physical devices |
| 9.1.4 | Build production: `eas build --platform android --profile production` |
| 9.1.5 | Submit to Play Store: `eas submit --platform android` |

### Task 9.2: iOS Build and Submission

| Step | Action |
|------|--------|
| 9.2.1 | Apple Developer account setup |
| 9.2.2 | Provisioning profiles via EAS |
| 9.2.3 | Build: `eas build --platform ios --profile production` |
| 9.2.4 | Submit to TestFlight: `eas submit --platform ios` |

---

## Migration Summary: Files Removed vs Replaced

### Files to REMOVE (PWA-specific)

| File | Reason |
|------|--------|
| `src/components/pwa/InstallPrompt.tsx` | Native apps dont need install prompts |
| `src/components/pwa/OfflineIndicator.tsx` | Rebuild with NetInfo for mobile |
| `src/hooks/useInstallPrompt.ts` | `beforeinstallprompt` is browser-only |
| `vite.config.ts` | Mobile uses Metro bundler |
| `vite-plugin-pwa` config | Service workers not used in native apps |

### Files to REPLACE (platform-specific reimplementation)

| Current File | Mobile Replacement | Reason |
|--------------|-------------------|--------|
| `src/services/notificationService.ts` | `apps/mobile/services/notificationService.ts` | Web Push → expo-notifications |
| `src/services/shareService.ts` | `apps/mobile/services/shareService.ts` | Web Share API → expo-sharing |
| `src/lib/offlineStorage.ts` | `apps/mobile/services/offlineService.ts` | IndexedDB → AsyncStorage |
| `src/hooks/useOffline.ts` | `apps/mobile/hooks/useOffline.ts` | navigator.onLine → NetInfo |
| `src/contexts/AuthContext.tsx` | `apps/mobile/contexts/AuthContext.tsx` | localStorage → SecureStore |

### Files to SHARE (move to packages/shared)

| Current File | New Location |
|--------------|--------------|
| `src/types/calendar.ts` | `packages/shared/types/calendar.ts` |
| `src/utils/calendarUtils.ts` | `packages/shared/utils/calendarUtils.ts` |
| `src/data/hinduEvents2026.ts` | `packages/shared/data/hinduEvents2026.ts` |
| `src/services/eventService.ts` | `packages/shared/services/eventService.ts` |
| `src/services/profileService.ts` | `packages/shared/services/profileService.ts` |
| `src/services/reminderService.ts` | `packages/shared/services/reminderService.ts` |
| `src/services/predefinedEventService.ts` | `packages/shared/services/predefinedEventService.ts` |

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| pnpm workspaces | Better monorepo support than npm/yarn |
| Service factory pattern | Allows injecting platform-specific Supabase client |
| NativeWind over StyleSheet | Maintains Tailwind familiarity, faster development |
| expo-router over React Navigation | File-based routing matches web mental model |
| AsyncStorage over MMKV | Simpler setup, sufficient for this use case |
| Bottom sheets over modals | More native mobile feel for day details |

---

## Next Steps

This plan should be executed in an external development environment. Recommended approach:

1. Set up the monorepo structure first (Phase 1)
2. Get basic Expo app running with navigation (Phase 2)
3. Implement auth flow with deep linking (Phase 3)
4. Add remaining features incrementally (Phases 4-9)

Would you like me to create the database migration for the `push_tokens` table, or provide more detail on any specific phase?
