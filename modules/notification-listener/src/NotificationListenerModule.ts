import { NativeModule, requireNativeModule } from 'expo';

import { NotificationListenerModuleEvents } from './NotificationListener.types';

declare class NotificationListenerModule extends NativeModule<NotificationListenerModuleEvents> {
  hasPermission(): boolean;
  requestPermission(): void;
  getInstalledApps(): any[];
  syncPref(key: string, value: string): void;
  stopNativeAlarm(): void;
  isNativeAlarmPlaying(): boolean;
}

let notificationListenerModule: NotificationListenerModule;
try {
  notificationListenerModule = requireNativeModule<NotificationListenerModule>('NotificationListener');
} catch (e) {
  console.warn('NotificationListener native module not found, using fallback implementation.', e);
  notificationListenerModule = {
    hasPermission: () => false,
    requestPermission: () => {},
    getInstalledApps: () => [],
    syncPref: () => {},
    stopNativeAlarm: () => {},
    isNativeAlarmPlaying: () => false,
    addListener: () => ({ remove: () => {} }),
    removeAllListeners: () => {},
  } as any;
}

export default notificationListenerModule;
