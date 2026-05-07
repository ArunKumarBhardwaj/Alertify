import { useEffect } from 'react';
import NotificationListenerModule from './src/NotificationListenerModule';
import { NotificationReceivedPayload } from './src/NotificationListener.types';

export function useNotificationListener(listener: (event: NotificationReceivedPayload) => void) {
  useEffect(() => {
    const subscription = NotificationListenerModule.addListener('onNotificationReceived', listener);
    return () => {
      subscription.remove();
    };
  }, [listener]);
}

export function hasPermission(): boolean {
  return NotificationListenerModule.hasPermission();
}

export function requestPermission(): void {
  NotificationListenerModule.requestPermission();
}

export interface AppInfo {
  packageName: string;
  name: string;
  icon?: string;
}

export function getInstalledApps(): AppInfo[] {
  return NotificationListenerModule.getInstalledApps();
}

export function syncPref(key: string, value: string): void {
  NotificationListenerModule.syncPref(key, value);
}

export function stopNativeAlarm(): void {
  NotificationListenerModule.stopNativeAlarm();
}

export function isNativeAlarmPlaying(): boolean {
  return NotificationListenerModule.isNativeAlarmPlaying();
}

export * from './src/NotificationListener.types';
