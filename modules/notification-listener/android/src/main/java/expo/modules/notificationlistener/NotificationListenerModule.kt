package expo.modules.notificationlistener

import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationListenerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NotificationListener")

    OnCreate {
      NotificationAlarmManager.listenerModule = this@NotificationListenerModule
    }

    OnDestroy {
      NotificationAlarmManager.listenerModule = null
    }

    Events("onNotificationReceived")

    Function("hasPermission") {
      val context = appContext.reactContext ?: return@Function false
      val packageName = context.packageName
      val listeners = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
      listeners != null && listeners.contains(packageName)
    }

    Function("requestPermission") {
      val activity = appContext.currentActivity
      if (activity != null) {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        activity.startActivity(intent)
      } else {
        val context = appContext.reactContext
        if (context != null) {
          val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          context.startActivity(intent)
        }
      }
    }

    Function("syncPref") { key: String, value: String ->
      val context = appContext.reactContext
      if (context != null) {
        val prefs = context.getSharedPreferences("AlertifyPrefs", Context.MODE_PRIVATE)
        prefs.edit().putString(key, value).apply()
      }
    }

    Function("stopNativeAlarm") {
      val context = appContext.reactContext
      if (context != null) {
        NotificationAlarmManager.stopAlarm(context)
      }
    }

    Function("isNativeAlarmPlaying") {
      NotificationAlarmManager.isPlaying
    }

    Function("copyAlarmSound") { sourceUri: String ->
      val context = appContext.reactContext ?: return@Function ""
      val storedPath = AlarmSoundStorage.copyFromUri(context, sourceUri)
      storedPath ?: ""
    }

    Function("clearAlarmSound") {
      val context = appContext.reactContext
      if (context != null) {
        AlarmSoundStorage.clear(context)
      }
    }

    Function("getInstalledApps") {
      val context = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
      AppDiscoveryHelper.getAllSelectableApps(context)
    }
  }
}
