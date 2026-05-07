import { useEffect, useState } from 'react';
import { Vibration, AppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { useNotificationListener, hasPermission, stopNativeAlarm, isNativeAlarmPlaying } from '../modules/notification-listener';
import { getSelectedApps, addHistoryItem, getAlarmSoundUri, isMonitoringEnabled } from '../lib/storage';

let isSirenPlaying = false;
let stopAudioCallback: (() => void) | null = null;
let globalPlayer: AudioPlayer | null = null;

export const stopSiren = () => {
  isSirenPlaying = false;
  Vibration.cancel();
  
  // Stop native side
  try { stopNativeAlarm(); } catch {}

  if (stopAudioCallback) {
    stopAudioCallback();
    stopAudioCallback = null;
  }

  if (globalPlayer) {
    globalPlayer.pause();
  }
};

export function useAlarmLogic() {
  const [permission, setPermission] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    setPermission(hasPermission());
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setPermission(hasPermission());
        setIsRinging(isSirenPlaying || isNativeAlarmPlaying());
      }
    });

    const interval = setInterval(() => {
      setIsRinging(isSirenPlaying || isNativeAlarmPlaying());
    }, 500);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, []);

  const playSiren = async () => {
    if (isSirenPlaying) return;
    isSirenPlaying = true;
    setIsRinging(true);

    // Vibrate continuously
    Vibration.vibrate([500, 500], true);

    // Play sound if user has selected one
    const soundUri = getAlarmSoundUri();
    if (!soundUri) return;

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
      });

      // Create player manually ONLY when needed
      if (!globalPlayer) {
        globalPlayer = createAudioPlayer({ uri: soundUri });
      } else {
        globalPlayer.replace({ uri: soundUri });
      }

      globalPlayer.loop = true;
      globalPlayer.play();
      
      stopAudioCallback = () => {
        try { globalPlayer?.pause(); } catch {}
      };
    } catch (error) {
      console.log('Audio playback skipped:', error);
    }
  };

  useNotificationListener((event) => {
    if (!isMonitoringEnabled()) return; // User disabled monitoring
    
    const selectedApps = getSelectedApps();
    if (selectedApps.includes(event.packageName)) {
      // 1. Always log to history
      addHistoryItem({
        title: event.title,
        text: event.text,
        packageName: event.packageName,
      });

      // 2. Only play JS siren if in foreground (Native handles background/killed)
      if (AppState.currentState === 'active') {
        playSiren();
      }
    }
  });

  return { permission, isRinging, stopSiren };
}
