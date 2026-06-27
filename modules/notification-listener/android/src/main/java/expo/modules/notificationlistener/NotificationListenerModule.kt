package expo.modules.notificationlistener

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
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

    Function("getInstalledApps") {
      val context = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
      val pm = context.packageManager
      val apps = pm.getInstalledPackages(PackageManager.GET_META_DATA)
      
      val result = mutableListOf<Map<String, Any>>()
      for (pkg in apps) {
        val appInfo = pkg.applicationInfo ?: continue
        val isSystem = (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
        // Filter: only show user-installed apps or system apps that are launchable (have an entry point)
        val launchIntent = pm.getLaunchIntentForPackage(pkg.packageName)
        if (launchIntent == null && isSystem) continue

        val name = appInfo.loadLabel(pm).toString()
        val packageName = pkg.packageName
        
        // Get app icon as base64 string
        val iconBase64 = getAppIconAsBase64(context, pm, packageName)

        val appMap = mutableMapOf<String, Any>(
          "packageName" to packageName,
          "name" to name
        )
        if (iconBase64 != null) {
          appMap["icon"] = iconBase64
        }
        result.add(appMap)
      }
      result.sortBy { (it["name"] as? String)?.lowercase() ?: "" }
      result
    }
  }

  private fun getAppIconAsBase64(context: Context, pm: PackageManager, packageName: String): String? {
    return try {
      val icon = pm.getApplicationIcon(packageName)
      val bitmap = if (icon is android.graphics.drawable.BitmapDrawable) {
        icon.bitmap
      } else {
        val width = icon.intrinsicWidth.coerceAtLeast(1)
        val height = icon.intrinsicHeight.coerceAtLeast(1)
        val bmp = android.graphics.Bitmap.createBitmap(width, height, android.graphics.Bitmap.Config.ARGB_8888)
        val canvas = android.graphics.Canvas(bmp)
        icon.setBounds(0, 0, canvas.width, canvas.height)
        icon.draw(canvas)
        bmp
      }
      val outputStream = java.io.ByteArrayOutputStream()
      bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, outputStream)
      val bytes = outputStream.toByteArray()
      "data:image/png;base64," + android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
    } catch (e: Exception) {
      null
    }
  }
}
