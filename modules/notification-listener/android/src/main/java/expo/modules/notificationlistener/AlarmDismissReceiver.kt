package expo.modules.notificationlistener

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class AlarmDismissReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != AlarmNotificationHelper.ACTION_DISMISS_ALARM) return
        Log.d("AlarmDismissReceiver", "Dismiss action received")
        NotificationAlarmManager.stopAlarm(context)
    }
}
