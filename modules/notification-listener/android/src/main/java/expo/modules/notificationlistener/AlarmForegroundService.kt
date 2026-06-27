package expo.modules.notificationlistener

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log

class AlarmForegroundService : Service() {
    companion object {
        private const val TAG = "AlarmForegroundService"
        const val ACTION_START = "com.arun_bhardwaj.Alertify.ACTION_START_ALARM"
        const val EXTRA_SOUND_URI = "sound_uri"

        fun start(context: Context, soundUri: String?) {
            val intent = Intent(context, AlarmForegroundService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_SOUND_URI, soundUri)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, AlarmForegroundService::class.java))
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val notification = AlarmNotificationHelper.buildDismissNotification(this)
                startForeground(AlarmNotificationHelper.NOTIFICATION_ID, notification)

                val soundUri = intent.getStringExtra(EXTRA_SOUND_URI)
                Log.d(TAG, "Starting alarm playback. Sound: $soundUri")
                NotificationAlarmManager.startPlayback(this, soundUri)
            }
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        NotificationAlarmManager.onServiceStopped()
        super.onDestroy()
    }
}
