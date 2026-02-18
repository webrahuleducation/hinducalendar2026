import { useFCMToken } from "@/hooks/useFCMToken";

export function FCMInitializer() {
  useFCMToken();
  return null;
}
