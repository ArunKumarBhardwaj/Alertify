import { requireNativeView } from 'expo';
import * as React from 'react';

import { NotificationListenerViewProps } from './NotificationListener.types';

const NativeView: React.ComponentType<NotificationListenerViewProps> =
  requireNativeView('NotificationListener');

export default function NotificationListenerView(props: NotificationListenerViewProps) {
  return <NativeView {...props} />;
}
