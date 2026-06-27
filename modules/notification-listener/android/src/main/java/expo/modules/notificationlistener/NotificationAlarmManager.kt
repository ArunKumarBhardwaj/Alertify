package expo.modules.notificationlistener

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import java.io.File

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
        Log.d(TAG, "Requesting alarm playback. Sound URI: $soundUriString")
        AlarmForegroundService.start(context, soundUriString)
    }

    fun startPlayback(context: Context, soundUriString: String?) {
        Log.d(TAG, "Starting native alarm playback. Sound URI: $soundUriString")
        startVibration(context)
        startAudio(context, soundUriString)
    }

    private fun startVibration(context: Context) {
        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager =
                context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        val pattern = longArrayOf(0, 500, 500, 500)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 1))
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(pattern, 1)
        }
    }

    private fun startAudio(context: Context, soundUriString: String?) {
        val resolvedPath = resolveSoundPath(context, soundUriString)
        if (resolvedPath.isNullOrEmpty()) {
            Log.d(TAG, "No alarm sound configured — vibrating only")
            return
        }

        try {
            mediaPlayer = MediaPlayer().apply {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                } else {
                    @Suppress("DEPRECATION")
                    setAudioStreamType(android.media.AudioManager.STREAM_ALARM)
                }

                val file = File(resolvedPath)
                if (file.exists()) {
                    setDataSource(file.absolutePath)
                } else {
                    setDataSource(context, android.net.Uri.parse(resolvedPath))
                }

                isLooping = true
                prepare()
                start()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start native audio playback", e)
        }
    }

    private fun resolveSoundPath(context: Context, soundUriString: String?): String? {
        if (!soundUriString.isNullOrEmpty()) {
            val file = File(soundUriString)
            if (file.exists()) return file.absolutePath
            if (soundUriString.startsWith("file://") || soundUriString.startsWith("content://")) {
                return soundUriString
            }
            return soundUriString
        }

        return AlarmSoundStorage.getStoredPath(context)
    }

    fun stopAlarm(context: Context) {
        isPlaying = false
        Log.d(TAG, "Stopping native alarm")
        stopAudioAndVibration()
        AlarmForegroundService.stop(context)
    }

    fun onServiceStopped() {
        isPlaying = false
        stopAudioAndVibration()
    }

    fun stopAudioAndVibration() {
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
    }
}
