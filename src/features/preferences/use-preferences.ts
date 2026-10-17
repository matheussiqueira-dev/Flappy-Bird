"use client";

import { useSyncExternalStore } from "react";

import { DEFAULT_PREFERENCES, getPreferencesStore, type Preferences } from "./preferences-store";

const subscribe = (listener: () => void) => getPreferencesStore().subscribe(listener);
const getSnapshot = () => getPreferencesStore().get();
const getServerSnapshot = (): Readonly<Preferences> => DEFAULT_PREFERENCES;

export function usePreferences(): Readonly<Preferences> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
