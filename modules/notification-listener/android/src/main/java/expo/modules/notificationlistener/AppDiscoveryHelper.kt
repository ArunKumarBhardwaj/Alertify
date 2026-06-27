package expo.modules.notificationlistener

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.util.Base64
import java.io.ByteArrayOutputStream

object AppDiscoveryHelper {
    private const val PREFS = "AlertifyPrefs"
    private const val RECENT_KEY = "recent_notification_apps"
    private const val MAX_RECENT = 30

    fun trackRecentApp(context: Context, packageName: String) {
        if (packageName == context.packageName) return

        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val recent = parseJsonArray(prefs.getString(RECENT_KEY, "[]") ?: "[]").toMutableList()
        recent.remove(packageName)
        recent.add(0, packageName)
        while (recent.size > MAX_RECENT) {
            recent.removeAt(recent.lastIndex)
        }
        prefs.edit().putString(RECENT_KEY, toJsonArray(recent)).apply()
    }

    fun getAllSelectableApps(context: Context): List<Map<String, Any>> {
        val pm = context.packageManager
        val result = mutableListOf<Map<String, Any>>()
        val seenPackages = mutableSetOf<String>()

        val launcherIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val resolveInfos = pm.queryIntentActivities(launcherIntent, 0)
        for (resolveInfo in resolveInfos) {
            val appInfo = resolveInfo.activityInfo?.applicationInfo ?: continue
            addApp(context, pm, appInfo.packageName, seenPackages, result)
        }

        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val recentPackages = parseJsonArray(prefs.getString(RECENT_KEY, "[]") ?: "[]")
        for (packageName in recentPackages) {
            addApp(context, pm, packageName, seenPackages, result)
        }

        result.sortBy { (it["name"] as? String)?.lowercase() ?: "" }
        return result
    }

    private fun addApp(
        context: Context,
        pm: PackageManager,
        packageName: String,
        seenPackages: MutableSet<String>,
        result: MutableList<Map<String, Any>>
    ) {
        if (seenPackages.contains(packageName)) return
        if (packageName == context.packageName) return

        try {
            val appInfo = pm.getApplicationInfo(packageName, 0)
            seenPackages.add(packageName)

            val name = appInfo.loadLabel(pm).toString()
            val appMap = mutableMapOf<String, Any>(
                "packageName" to packageName,
                "name" to name
            )
            val iconBase64 = getAppIconAsBase64(pm, packageName)
            if (iconBase64 != null) {
                appMap["icon"] = iconBase64
            }
            result.add(appMap)
        } catch (_: PackageManager.NameNotFoundException) {
            // Package no longer installed or not visible to the app.
        }
    }

    private fun getAppIconAsBase64(pm: PackageManager, packageName: String): String? {
        return try {
            val icon = pm.getApplicationIcon(packageName)
            val bitmap = if (icon is BitmapDrawable) {
                icon.bitmap
            } else {
                val width = icon.intrinsicWidth.coerceAtLeast(1)
                val height = icon.intrinsicHeight.coerceAtLeast(1)
                val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bmp)
                icon.setBounds(0, 0, canvas.width, canvas.height)
                icon.draw(canvas)
                bmp
            }
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
            val bytes = outputStream.toByteArray()
            "data:image/png;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
        } catch (_: Exception) {
            null
        }
    }

    fun parseJsonArray(json: String): List<String> {
        val clean = json.trim().removePrefix("[").removeSuffix("]")
        if (clean.isEmpty()) return emptyList()
        return clean.split(",").map { it.trim().removeSurrounding("\"").removeSurrounding("'") }
    }

    fun toJsonArray(items: List<String>): String {
        if (items.isEmpty()) return "[]"
        return items.joinToString(prefix = "[", postfix = "]", separator = ",") { "\"$it\"" }
    }
}
