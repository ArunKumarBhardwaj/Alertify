package expo.modules.notificationlistener

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class NotificationListenerService : NotificationListenerService() {
    companion object {
        private const val TAG = "NotificationListenerSvc"
        private const val CHANNEL_ID = "alertify_alarm_channel"
        private const val NOTIFICATION_ID = 9999

        private var dismissReceiver: BroadcastReceiver? = null

        fun showDismissNotification(context: Context) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Alertify Alarms",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Channel for active emergency sirens"
                    setSound(null, null)
                    enableVibration(false)
                }
                notificationManager.createNotificationChannel(channel)
            }

            // Register receiver dynamically if not done yet
            if (dismissReceiver == null) {
                dismissReceiver = object : BroadcastReceiver() {
                    override fun onReceive(c: Context, intent: Intent) {
                        if (intent.action == "com.arun_bhardwaj.Alertify.ACTION_DISMISS_ALARM") {
                            Log.d(TAG, "Dismiss action clicked from notification")
                            NotificationAlarmManager.stopAlarm(c)
                        }
                    }
                }
                val filter = IntentFilter("com.arun_bhardwaj.Alertify.ACTION_DISMISS_ALARM")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    context.registerReceiver(dismissReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
                } else {
                    @Suppress("UnspecifiedRegisterReceiverFlag")
                    context.registerReceiver(dismissReceiver, filter)
                }
            }

            val dismissIntent = Intent("com.arun_bhardwaj.Alertify.ACTION_DISMISS_ALARM")
            val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val dismissPendingIntent = PendingIntent.getBroadcast(
                context, 0, dismissIntent, pendingIntentFlags
            )

            val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Notification.Builder(context, CHANNEL_ID)
            } else {
                @Suppress("DEPRECATION")
                Notification.Builder(context)
            }

            // Intent to open the main app activity
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val launchPendingIntent = if (launchIntent != null) {
                PendingIntent.getActivity(context, 1, launchIntent, pendingIntentFlags)
            } else {
                null
            }

            val notification = builder
                .setContentTitle("Alertify Siren Ringing")
                .setContentText("An emergency notification matched your monitoring list.")
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setOngoing(true)
                .setAutoCancel(false)
                .apply {
                    if (launchPendingIntent != null) {
                        setContentIntent(launchPendingIntent)
                    }
                }
                .addAction(
                    android.R.drawable.ic_menu_close_clear_cancel,
                    "Dismiss Alarm",
                    dismissPendingIntent
                )
                .build()

            notificationManager.notify(NOTIFICATION_ID, notification)
        }

        fun cancelDismissNotification(context: Context) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.cancel(NOTIFICATION_ID)
            
            dismissReceiver?.let {
                try {
                    context.unregisterReceiver(it)
                } catch (e: Exception) {
                    // Ignore if already unregistered
                }
                dismissReceiver = null
            }
        }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val context = applicationContext
        val prefs = context.getSharedPreferences("AlertifyPrefs", Context.MODE_PRIVATE)

        val monitoringEnabled = prefs.getString("monitoring_enabled", "true") == "true"
        if (!monitoringEnabled) return

        val packageName = sbn.packageName
        
        // Don't monitor our own notifications
        if (packageName == context.packageName) return

        val selectedAppsJson = prefs.getString("selected_apps", "[]") ?: "[]"
        val selectedApps = parseJsonArray(selectedAppsJson)
        if (!selectedApps.contains(packageName)) return

        val extras = sbn.notification.extras
        val title = extras.getString(Notification.EXTRA_TITLE, "") ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT, "")?.toString() ?: ""

        Log.d(TAG, "Notification received from: $packageName, title: $title, text: $text")

        // 1. Notify React Native if running
        NotificationAlarmManager.listenerModule?.let { module ->
            try {
                module.sendEvent("onNotificationReceived", mapOf(
                    "title" to title,
                    "text" to text,
                    "packageName" to packageName
                ))
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send event to JS", e)
            }
        }

        // 2. Play Alarm native side (loop sound and vibrate)
        val soundUri = prefs.getString("alarm_sound_uri", null)
        NotificationAlarmManager.playAlarm(context, soundUri)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // Optional action
    }

    private fun parseJsonArray(json: String): List<String> {
        val clean = json.trim().removePrefix("[").removeSuffix("]")
        if (clean.isEmpty()) return emptyList()
        return clean.split(",").map { it.trim().removeSurrounding("\"").removeSurrounding("'") }
    }
}
