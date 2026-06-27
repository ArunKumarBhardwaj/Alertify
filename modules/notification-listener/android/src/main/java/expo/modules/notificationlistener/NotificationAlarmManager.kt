package expo.modules.notificationlistener

import android.content.Context
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log

object NotificationAlarmManager {
    private const val TAG = "NotificationAlarm"
    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    
    @Volatile
    var isPlaying = false
        private set

    @Volatile
    var listenerModule: NotificationListenerModule? = null

    fun playAlarm(context: Context, soundUriString: String?) {
        if (isPlaying) return
        isPlaying = true

        Log.d(TAG, "Playing native alarm. Sound URI: $soundUriString")

        // Start looping vibration
        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        val pattern = longArrayOf(0, 500, 500, 500) // delay, vibrate, pause, vibrate...
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 1)) // 1 is index to repeat from
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(pattern, 1)
        }

        // Play alarm audio
        try {
            val uri = if (!soundUriString.isNullOrEmpty()) {
                Uri.parse(soundUriString)
            } else {
                android.provider.Settings.System.DEFAULT_RINGTONE_URI
            }

            mediaPlayer = MediaPlayer().apply {
                setDataSource(context, uri)
                isLooping = true
                prepare()
                start()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start native audio playback", e)
        }
        
        // Show persistent notification to dismiss alarm
        NotificationListenerService.showDismissNotification(context)
    }

    fun stopAlarm(context: Context) {
        if (!isPlaying) return
        isPlaying = false

        Log.d(TAG, "Stopping native alarm")

        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping media player", e)
        }

        try {
            vibrator?.cancel()
            vibrator = null
        } catch (e: Exception) {
            Log.e(TAG, "Error cancelling vibrator", e)
        }
        
        NotificationListenerService.cancelDismissNotification(context)
    }
}
