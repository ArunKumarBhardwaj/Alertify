import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import {
  useNotificationListener,
  hasPermission,
  stopNativeAlarm,
  isNativeAlarmPlaying,
} from '../modules/notification-listener';
import { getSelectedApps, addHistoryItem, isMonitoringEnabled } from '../lib/storage';

type AlarmContextValue = {
  permission: boolean;
  isRinging: boolean;
  stopSiren: () => void;
};

const AlarmContext = createContext<AlarmContextValue>({
  permission: false,
  isRinging: false,
  stopSiren: () => {},
});

export const stopSiren = () => {
  try {
    stopNativeAlarm();
  } catch {
    // Native module may be unavailable during dev hot reload.
  }
};

export function AlarmProvider({ children }: { children: ReactNode }) {
  const [permission, setPermission] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    setPermission(hasPermission());
    setIsRinging(isNativeAlarmPlaying());

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setPermission(hasPermission());
        setIsRinging(isNativeAlarmPlaying());
      }
    });

    const interval = setInterval(() => {
      setIsRinging(isNativeAlarmPlaying());
    }, 400);

    return () => {
      appStateSub.remove();
      clearInterval(interval);
    };
  }, []);

  useNotificationListener((event) => {
    if (!isMonitoringEnabled()) return;

    const selectedApps = getSelectedApps();
    if (!selectedApps.includes(event.packageName)) return;

    addHistoryItem({
      title: event.title,
      text: event.text,
      packageName: event.packageName,
    });

    setIsRinging(isNativeAlarmPlaying());
  });

  return (
    <AlarmContext.Provider value={{ permission, isRinging, stopSiren }}>
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarm() {
  return useContext(AlarmContext);
}

export function useAlarmLogic() {
  return useAlarm();
}
