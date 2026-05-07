# 🚨 Alertify

Alertify is a high-performance emergency notification pager built with React Native and Native Kotlin. It transforms your Android device into a reliable alerting tool that ensures you never miss critical notifications from your selected applications.

## 🚀 Key Features

- **Killed-Mode Reliability**: Unlike standard apps, Alertify uses a native Android `NotificationListenerService`. This ensures that even if the app is fully closed or killed by the OS, the siren and vibration will still trigger.
- **Native Siren Engine**: Built with Kotlin's `MediaPlayer` for low-latency, high-volume emergency sounds that work independently of the React Native bridge.
- **Persistent Alarms**: Once triggered, the alarm continues to loop with a custom vibration pattern until manually dismissed via the in-app overlay or the persistent system notification.
- **Custom Sound Picker**: Select any audio file from your device to use as your emergency alert sound.
- **App Filtering**: Choose exactly which apps (e.g., WhatsApp, PagerDuty, Slack) are allowed to trigger the alarm.
- **Modern UI**: A sleek, high-performance interface built with `@legendapp/list` for smooth scrolling and Material Design aesthetics.

## 🛠️ Technical Stack

- **Framework**: Expo (SDK 52) / React Native
- **Native Logic**: Kotlin (NotificationListenerService, BroadcastReceivers)
- **Audio**: `expo-audio` (JS) + `MediaPlayer` (Kotlin)
- **State Management**: `react-native-mmkv` + Native `SharedPreferences` sync
- **Styling**: Vanilla CSS-in-JS with a Premium Dark Theme

## 📦 Installation & Setup

1. **Clone the repo**:
   ```bash
   git clone https://github.com/ArunKumarBhardwaj/Alertify.git
   cd Alertify
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build and Run**:
   Since the app uses custom native modules, you must run a native build:
   ```bash
   npx expo run:android
   ```

## 🔐 Important Permissions

To function correctly, Alertify requires:
- **Notification Access**: Required to detect incoming messages from your chosen apps.
- **Battery Optimization Exemption**: To ensure the service stays alive, set the app battery usage to "Unrestricted" in Android settings.

---
Built with ❤️ for reliability.
