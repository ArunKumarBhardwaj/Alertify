import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <NativeTabs
      tintColor={Colors[colorScheme].tint}
      rippleColor={Colors[colorScheme].border}
    >
      <NativeTabs.Trigger name="apps">
        <NativeTabs.Trigger.Label>Applications</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="apps" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Engine</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
