export type NotificationReceivedPayload = {
  title: string;
  text: string;
  packageName: string;
};

export type NotificationListenerModuleEvents = {
  onNotificationReceived: (params: NotificationReceivedPayload) => void;
};
