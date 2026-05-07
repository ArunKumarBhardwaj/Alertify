import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Vibration, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { requestPermission, hasPermission } from '../../../modules/notification-listener';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getHistory, HistoryItem, getAlarmSoundUri, saveAlarmSoundUri, isMonitoringEnabled, setMonitoringEnabled } from '@/lib/storage';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];

  const [permission, setPermission] = useState(hasPermission());
  const [monitoring, setMonitoring] = useState(isMonitoringEnabled());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [alarmSoundUri, setAlarmSoundUri] = useState<string | null>(null);
  const [alarmSoundName, setAlarmSoundName] = useState<string>('No sound selected');

  useEffect(() => {
    setHistory(getHistory());
    const uri = getAlarmSoundUri();
    setAlarmSoundUri(uri);
    if (uri) setAlarmSoundName(uri.split('/').pop() ?? 'Custom sound');
    setLoading(false);

    const interval = setInterval(() => {
      setHistory(getHistory());
      setPermission(hasPermission());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const animatedStatusStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      permission ? colors.success + '15' : colors.danger + '15',
      { duration: 300 }
    ),
  }));

  const toggleMonitoring = (val: boolean) => {
    setMonitoring(val);
    setMonitoringEnabled(val);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const testVibration = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Vibration.vibrate([200, 100, 200]);
  };

  const pickAlarmSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        saveAlarmSoundUri(asset.uri);
        setAlarmSoundUri(asset.uri);
        setAlarmSoundName(asset.name ?? 'Custom sound');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.error('Sound picker error:', e);
    }
  };

  const clearAlarmSound = () => {
    saveAlarmSoundUri(null);
    setAlarmSoundUri(null);
    setAlarmSoundName('No sound selected');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.tint} />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Service Status */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Monitoring Toggle */}
        <View style={styles.monitoringRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.monitoringTitle, { color: colors.text }]}>Alarm Monitoring</Text>
            <Text style={[styles.monitoringDesc, { color: colors.icon }]}>
              {monitoring ? 'Active — alarms will trigger' : 'Paused — no alarms will fire'}
            </Text>
          </View>
          <Switch
            value={monitoring}
            onValueChange={toggleMonitoring}
            trackColor={{ false: colors.border, true: colors.tint + '80' }}
            thumbColor={monitoring ? colors.tint : colors.icon}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.cardHeader}>
          <Text style={[styles.cardLabel, { color: colors.icon }]}>NOTIFICATION ACCESS</Text>
          <Animated.View style={[styles.statusBadge, animatedStatusStyle]}>
            <Text style={[styles.statusText, { color: permission ? colors.success : colors.danger }]}>
              {permission ? 'Granted' : 'Required'}
            </Text>
          </Animated.View>
        </View>
        {!permission && (
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.tint }]}
            onPress={() => { Haptics.selectionAsync(); requestPermission(); }}
          >
            <Text style={styles.buttonText}>Grant Access</Text>
          </Pressable>
        )}
      </View>

      {/* Alarm Sound */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Alarm Sound</Text>
        <View style={[styles.soundCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.soundInfo}>
            <IconSymbol name="music-note" size={18} color={colors.tint} />
            <Text
              style={[styles.soundName, { color: alarmSoundUri ? colors.text : colors.icon }]}
              numberOfLines={1}
            >
              {alarmSoundName}
            </Text>
          </View>
          <View style={styles.soundActions}>
            {alarmSoundUri && (
              <Pressable
                onPress={clearAlarmSound}
                style={[styles.clearBtn, { borderColor: colors.danger }]}
              >
                <Text style={[styles.clearBtnText, { color: colors.danger }]}>✕</Text>
              </Pressable>
            )}
            <Pressable
              onPress={pickAlarmSound}
              style={[styles.browseBtn, { backgroundColor: colors.tint }]}
            >
              <Text style={styles.browseBtnText}>Browse</Text>
            </Pressable>
          </View>
        </View>
        <Text style={[styles.soundHint, { color: colors.icon }]}>
          {alarmSoundUri
            ? 'This sound will loop until you dismiss the alarm.'
            : 'No sound selected — alarm will vibrate only.'}
        </Text>
      </View>

      {/* History */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Alert History</Text>
          <Pressable onPress={testVibration}>
            <Text style={{ color: colors.tint, fontSize: 13, fontWeight: '600' }}>Test Vibration</Text>
          </Pressable>
        </View>

        <View style={styles.historyStack}>
          {history.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.icon }]}>No alerts recorded yet.</Text>
            </View>
          ) : (
            history.slice(0, 20).map(item => (
              <View
                key={item.id}
                style={[styles.historyRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.historyMeta}>
                  <Text style={[styles.historyApp, { color: colors.tint }]}>
                    {item.packageName.split('.').pop()}
                  </Text>
                  <Text style={[styles.historyDate, { color: colors.icon }]}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
                <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.historyBody, { color: colors.icon }]} numberOfLines={1}>
                  {item.text}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingTop: 20, paddingBottom: 60 },
  card: { padding: 20, borderRadius: 10, borderWidth: 1, marginBottom: 24 },
  monitoringRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  monitoringTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  monitoringDesc: { fontSize: 13, fontWeight: '500' },
  divider: { height: 1, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  primaryButton: { height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  soundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  soundInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden' },
  soundName: { fontSize: 14, fontWeight: '500', flexShrink: 1 },
  soundActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: { fontSize: 14, fontWeight: '700', lineHeight: 16 },
  browseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  browseBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  soundHint: { fontSize: 12, fontWeight: '500' },
  historyStack: { gap: 8 },
  historyRow: { padding: 14, borderRadius: 10, borderWidth: 1 },
  historyMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  historyApp: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  historyDate: { fontSize: 10, fontWeight: '500' },
  historyTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  historyBody: { fontSize: 13, fontWeight: '400' },
  emptyBox: { padding: 30, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '500' },
});
