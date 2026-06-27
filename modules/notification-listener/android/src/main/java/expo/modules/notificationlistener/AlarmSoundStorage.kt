package expo.modules.notificationlistener

import android.content.Context
import android.net.Uri
import java.io.File

object AlarmSoundStorage {
    private const val ALARM_FILE_NAME = "alarm_sound"

    fun copyFromUri(context: Context, sourceUriString: String): String? {
        return try {
            val source = Uri.parse(sourceUriString)
            val dest = File(context.filesDir, ALARM_FILE_NAME)
            context.contentResolver.openInputStream(source)?.use { input ->
                dest.outputStream().use { output ->
                    input.copyTo(output)
                }
            } ?: return null

            if (!dest.exists() || dest.length() == 0L) return null
            dest.absolutePath
        } catch (_: Exception) {
            null
        }
    }

    fun getStoredPath(context: Context): String? {
        val dest = File(context.filesDir, ALARM_FILE_NAME)
        return if (dest.exists() && dest.length() > 0L) dest.absolutePath else null
    }

    fun clear(context: Context) {
        try {
            File(context.filesDir, ALARM_FILE_NAME).delete()
        } catch (_: Exception) {
            // Ignore cleanup failures.
        }
    }
}
