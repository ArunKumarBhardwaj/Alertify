import * as React from 'react';

import { NotificationListenerViewProps } from './NotificationListener.types';

export default function NotificationListenerView(props: NotificationListenerViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
