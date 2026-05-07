import { NativeModule, requireNativeModule } from 'expo';

import { NotificationListenerModuleEvents } from './NotificationListener.types';

declare class NotificationListenerModule extends NativeModule<NotificationListenerModuleEvents> {
  hasPermission(): boolean;
  requestPermission(): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<NotificationListenerModule>('NotificationListener');
