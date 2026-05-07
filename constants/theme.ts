/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1D1B16',
    background: '#F9F8F6',
    surface: '#FFFFFF',
    border: '#E5E2DD',
    tint: '#D97757', // Claude Rust
    icon: '#6B6256',
    tabIconDefault: '#6B6256',
    tabIconSelected: '#D97757',
    danger: '#B91C1C',
    success: '#059669',
  },
  dark: {
    text: '#F9F8F6',
    background: '#1D1B16',
    surface: '#26241E',
    border: '#3F3B34',
    tint: '#D97757',
    icon: '#A19789',
    tabIconDefault: '#A19789',
    tabIconSelected: '#D97757',
    danger: '#EF4444',
    success: '#10B981',
  },
};

export type ThemeColors = typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
