import { useSyncExternalStore, useCallback } from "react";
import { SettingsEngine } from "../settings/storage";

export function useSetting(key) {
  const getSnapshot = useCallback(() => SettingsEngine.get(key), [key]);

  const value = useSyncExternalStore(
    SettingsEngine.subscribe,
    getSnapshot
  );

  const setValue = useCallback((newVal) => {
    SettingsEngine.set(key, newVal);
  }, [key]);

  return [value, setValue];
}
