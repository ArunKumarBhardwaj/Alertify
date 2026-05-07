import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './NotificationListener.types';

type NotificationListenerModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class NotificationListenerModule extends NativeModule<NotificationListenerModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(NotificationListenerModule, 'NotificationListenerModule');
