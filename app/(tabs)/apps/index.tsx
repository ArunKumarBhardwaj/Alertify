import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSelectedApps, saveSelectedApps } from '@/lib/storage';
import { LegendList } from '@legendapp/list';
import { useHeaderHeight } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { AppInfo, getInstalledApps } from '../../../modules/notification-listener';

const AppCard = memo(({ 
  item, 
  isSelected, 
  onToggle, 
  colors,
  width
}: { 
  item: AppInfo, 
  isSelected: boolean, 
  onToggle: (p: string) => void,
  colors: ThemeColors,
  width: number
}) => {
  return (
    <Pressable 
      onPress={() => onToggle(item.packageName)}
      style={[styles.appCard, { width: width }]}
    >
      <View style={[
        styles.iconWrapper, 
        {
          borderColor: isSelected ? colors.tint : colors.border,
          backgroundColor: isSelected ? colors.surface : colors.background,
        }
      ]}>
        {item.icon ? (
          <Image source={{ uri: item.icon }} style={styles.appIcon} />
        ) : (
          <View style={[styles.appIconPlaceholder, { backgroundColor: colors.border }]}>
            <Text style={[styles.appInitial, { color: colors.icon }]}>{item.name.charAt(0)}</Text>
          </View>
        )}
        
        {isSelected && (
          <View style={[styles.checkOverlay, { backgroundColor: colors.tint }]}>
            <IconSymbol name="check" size={10} color="white" />
          </View>
        )}
      </View>
      
      <Text 
        style={[
          styles.appName, 
          { color: isSelected ? colors.tint : colors.text }
        ]} 
        numberOfLines={1}
      >
        {item.name}
      </Text>
    </Pressable>
  );
});

export default function AppsScreen() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const headerHeight = useHeaderHeight();
  
  // Cache the card width and height for getItemLayout
  const cardWidth = useMemo(() => (width - 32) / 3, [width]);
  const ITEM_HEIGHT = 105; // Approximate fixed height per card

  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const allApps = getInstalledApps();
    setApps(allApps);
    const saved = getSelectedApps();
    setSelectedPackages(new Set(saved));
    setLoading(false);
  }, []);

  const filteredApps = useMemo(() => {
    const query = search.toLowerCase();
    if (!query) return apps;
    return apps.filter(app => 
      app.name.toLowerCase().includes(query) ||
      app.packageName.toLowerCase().includes(query)
    );
  }, [apps, search]);

  const toggleApp = React.useCallback((packageName: string) => {
    console.log('Toggling app:', packageName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPackages(prev => {
      const next = new Set(prev);
      if (next.has(packageName)) {
        next.delete(packageName);
      } else {
        next.add(packageName);
      }
      saveSelectedApps(Array.from(next));
      return next;
    });
  }, []);

  const renderItem = React.useCallback(({ item }: { item: AppInfo }) => (
    <AppCard 
      item={item} 
      isSelected={selectedPackages.has(item.packageName)} 
      onToggle={toggleApp}
      colors={colors}
      width={cardWidth}
    />
  ), [selectedPackages, toggleApp, colors, cardWidth]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="small" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerTitle: 'Applications',
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerSearchBarOptions: {
            placeholder: 'Search...',
            onChangeText: (event) => setSearch(event.nativeEvent.text),
            onCancelButtonPress: () => setSearch(''),
            textColor: colors.text,
            hintTextColor: colors.icon,
          }
        }}
      />

      <LegendList
        data={filteredApps}
        keyExtractor={(item) => item.packageName}
        numColumns={3}
        renderItem={renderItem}
        estimatedItemSize={ITEM_HEIGHT}
        extraData={selectedPackages}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 40, 
    paddingTop: 12,
    gap: 8, // Spacing between rows
  },
  appCard: { 
    flex: 1/3, // Ensure cards take up equal space
    alignItems: 'center', 
    paddingVertical: 12,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    borderWidth: 1.5,
  },
  appIcon: {
    width: 46,
    height: 46,
    borderRadius: 6,
  },
  appIconPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appInitial: {
    fontSize: 18,
    fontWeight: '600',
  },
  checkOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  appName: { 
    fontSize: 11, 
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
});
