import { createMMKV } from 'react-native-mmkv';
import { syncPref } from '../modules/notification-listener';

export const storage = createMMKV();

export const StorageKeys = {
  SELECTED_APPS: 'alertify_selected_apps',
  HISTORY: 'alertify_history',
  ALARM_SOUND_URI: 'alertify_alarm_sound_uri',
  MONITORING_ENABLED: 'alertify_monitoring_enabled',
};

// Sync key/value to Android SharedPreferences so Kotlin service can read when app is killed
const syncToNative = (key: string, value: string) => {
  try { syncPref(key, value); } catch {}
};

export const getSelectedApps = (): string[] => {
  const data = storage.getString(StorageKeys.SELECTED_APPS);
  return data ? JSON.parse(data) : [];
};

export const saveSelectedApps = (apps: string[]) => {
  const json = JSON.stringify(apps);
  storage.set(StorageKeys.SELECTED_APPS, json);
  syncToNative('selected_apps', json);
};

export const getAlarmSoundUri = (): string | null => {
  return storage.getString(StorageKeys.ALARM_SOUND_URI) ?? null;
};

export const saveAlarmSoundUri = (uri: string | null) => {
  if (uri) {
    storage.set(StorageKeys.ALARM_SOUND_URI, uri);
    syncToNative('alarm_sound_uri', uri);
  } else {
    storage.remove(StorageKeys.ALARM_SOUND_URI);
    syncToNative('alarm_sound_uri', '');
  }
};

export const isMonitoringEnabled = (): boolean => {
  // Default to true if never set
  const val = storage.getString(StorageKeys.MONITORING_ENABLED);
  return val !== 'false';
};

export const setMonitoringEnabled = (enabled: boolean) => {
  const val = enabled ? 'true' : 'false';
  storage.set(StorageKeys.MONITORING_ENABLED, val);
  syncToNative('monitoring_enabled', val);
};

export interface HistoryItem {
  id: string;
  title: string;
  text: string;
  packageName: string;
  timestamp: number;
}

export const getHistory = (): HistoryItem[] => {
  const data = storage.getString(StorageKeys.HISTORY);
  return data ? JSON.parse(data) : [];
};

export const saveHistory = (history: HistoryItem[]) => {
  storage.set(StorageKeys.HISTORY, JSON.stringify(history));
};

export const addHistoryItem = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
  };
  const updated = [newItem, ...history].slice(0, 50);
  saveHistory(updated);
  return updated;
};
