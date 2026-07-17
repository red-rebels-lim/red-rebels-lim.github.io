package com.redrebels.red_rebels_calendar

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.text.style.RelativeSizeSpan
import android.view.View
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetLaunchIntent
import es.antonborri.home_widget.HomeWidgetPlugin
import kotlin.math.tan

/**
 * Next-match home-screen widget (Phase 9, PRD N-2) — visual design: Claude
 * Design concept "1c ULTRA DIAGONAL" (approved 2026-07-16).
 *
 * Renders the payload written by the Flutter side
 * (lib/logic/home_widget_updater.dart) — all strings arrive pre-localized.
 * This class owns two things:
 *  - the card background (dark surface + 17°-raked panel + 2dp seam),
 *    canvas-rendered per widget size so the diagonal never scales weirdly
 *    (the design's per-size-asset requirement, minus the assets);
 *  - the countdown, recomputed at render time in the web useCountdown
 *    cadence (⏱ 38d 4h / 4h 12m / 12m) with per-language unit letters, so
 *    the 30-minute updatePeriodMillis re-render keeps it ticking without
 *    waking the app.
 *
 * The panel flips to volleyball blue per the design's "treatment C".
 */
class NextMatchWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        for (appWidgetId in appWidgetIds) render(context, appWidgetManager, appWidgetId)
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle,
    ) {
        render(context, appWidgetManager, appWidgetId)
    }

    private fun render(context: Context, manager: AppWidgetManager, appWidgetId: Int) {
        val prefs = HomeWidgetPlugin.getData(context)
        val hasMatch = prefs.getBoolean("hasMatch", false)
        val label = prefs.getString("label", "NEXT MATCH") ?: "NEXT MATCH"
        val homeTeam = prefs.getString("homeTeam", "") ?: ""
        val awayTeam = prefs.getString("awayTeam", "") ?: ""
        val homeLogo = prefs.getString("homeLogo", "") ?: ""
        val awayLogo = prefs.getString("awayLogo", "") ?: ""
        val sportLabel = prefs.getString("sportLabel", "") ?: ""
        val dateLabel = prefs.getString("dateLabel", "") ?: ""
        val venue = prefs.getString("venue", "") ?: ""
        val isCup = prefs.getBoolean("isCup", false)
        val cupLabel = prefs.getString("cupLabel", "CUP") ?: "CUP"
        val isVolleyball = prefs.getBoolean("isVolleyball", false)
        val emptyText = prefs.getString("emptyText", "") ?: ""
        val caption = prefs.getString("caption", "TO KICKOFF") ?: "TO KICKOFF"
        val units = prefs.getString("countdownUnits", "dhm") ?: "dhm"
        val eventKey = prefs.getString("eventKey", "") ?: ""
        // saveWidgetData stores Dart ints as Long.
        val kickoffMillis = try {
            prefs.getLong("kickoffMillis", 0L)
        } catch (_: ClassCastException) {
            prefs.getInt("kickoffMillis", 0).toLong()
        }

        // A fixture whose kickoff passed more than two hours ago is stale
        // (the app hasn't run since) — fall back to the empty state rather
        // than advertising a match that is over.
        val remaining = kickoffMillis - System.currentTimeMillis()
        val showMatch = hasMatch && remaining > -2 * 60 * 60 * 1000L

        // Portrait cell size from the host; fall back to the 4×2 minimum.
        val options = manager.getAppWidgetOptions(appWidgetId)
        val widthDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
            .takeIf { it > 0 } ?: 320
        val heightDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT)
            .takeIf { it > 0 } ?: 140
        val compact = heightDp < 100

        val panelColor = if (isVolleyball) 0xFF3B82F6.toInt() else 0xFFE02520.toInt()
        val seamColor = if (isVolleyball) 0xFF1D4ED8.toInt() else 0xFFB51B17.toInt()

        val views = RemoteViews(
            context.packageName,
            if (compact) R.layout.widget_next_match_small else R.layout.widget_next_match,
        )

        views.setImageViewBitmap(
            R.id.widget_bg,
            renderBackground(context, widthDp, heightDp, compact, panelColor, seamColor),
        )
        views.setTextViewText(R.id.widget_label, label)
        views.setTextColor(R.id.widget_label, panelColor)

        // Reserve the panel area: the column may run up to the panel's
        // bottom-left corner (its leftmost point), whatever the host size.
        val density = context.resources.displayMetrics.density
        val paddingEndPx =
            (widthDp * (if (compact) COMPACT_PANEL_SHARE else PANEL_SHARE) * density).toInt()
        views.setViewPadding(
            R.id.widget_left_column,
            (16 * density).toInt(),
            if (compact) 0 else (14 * density).toInt(),
            paddingEndPx,
            if (compact) 0 else (13 * density).toInt(),
        )

        val muted = 0xFF94A3B8.toInt()

        if (compact) {
            // 4×1: crest VS crest · date (stakeholder request 2026-07-16);
            // "VS AWAY · DATE" text stands in when a crest asset is missing.
            val homeCrest = if (showMatch) loadCrest(context, homeLogo) else null
            val awayCrest = if (showMatch) loadCrest(context, awayLogo) else null
            if (showMatch && homeCrest != null && awayCrest != null) {
                views.setViewVisibility(R.id.widget_compact_row, View.VISIBLE)
                views.setViewVisibility(R.id.widget_title, View.GONE)
                views.setImageViewBitmap(R.id.widget_home_crest, homeCrest)
                views.setImageViewBitmap(R.id.widget_away_crest, awayCrest)
                views.setTextViewText(
                    R.id.widget_compact_date,
                    if (venue.isEmpty()) dateLabel else "$dateLabel\n$venue",
                )
                bindCountdown(views, remaining, units, captionId = null)
            } else if (showMatch) {
                views.setViewVisibility(R.id.widget_compact_row, View.GONE)
                views.setViewVisibility(R.id.widget_title, View.VISIBLE)
                val title = SpannableStringBuilder()
                title.append("VS $awayTeam")
                val metaStart = title.length
                title.append("  · $dateLabel")
                title.setSpan(RelativeSizeSpan(11f / 19f), metaStart, title.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                title.setSpan(ForegroundColorSpan(muted), metaStart, title.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                views.setTextViewText(R.id.widget_title, title)
                bindCountdown(views, remaining, units, captionId = null)
            } else {
                views.setViewVisibility(R.id.widget_compact_row, View.GONE)
                views.setViewVisibility(R.id.widget_title, View.VISIBLE)
                views.setTextViewText(R.id.widget_title, emptyText)
                views.setViewVisibility(R.id.widget_chronometer, View.GONE)
                views.setViewVisibility(R.id.widget_countdown, View.GONE)
            }
        } else if (showMatch) {
            views.setViewVisibility(R.id.widget_team_home, View.VISIBLE)
            views.setViewVisibility(R.id.widget_team_away, View.VISIBLE)
            views.setViewVisibility(R.id.widget_empty, View.GONE)
            views.setViewVisibility(R.id.widget_meta, View.VISIBLE)
            views.setViewVisibility(R.id.widget_caption, View.VISIBLE)
            views.setViewVisibility(R.id.widget_cup_chip, if (isCup) View.VISIBLE else View.GONE)

            views.setTextViewText(R.id.widget_team_home, homeTeam)
            // "VS" runs smaller and muted inside the equal-weight away line.
            val awayLine = SpannableStringBuilder()
            awayLine.append("VS ")
            awayLine.setSpan(RelativeSizeSpan(13f / 23f), 0, 2, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            awayLine.setSpan(ForegroundColorSpan(muted), 0, 2, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            awayLine.append(awayTeam)
            views.setTextViewText(R.id.widget_team_away, awayLine)

            views.setTextViewText(R.id.widget_cup_chip, cupLabel)
            val meta = StringBuilder("$sportLabel\n$dateLabel")
            if (venue.isNotEmpty()) meta.append("\n").append(venue)
            views.setTextViewText(R.id.widget_meta, meta)
            views.setTextViewText(R.id.widget_caption, caption)
            bindCountdown(views, remaining, units, captionId = R.id.widget_caption)
        } else {
            views.setViewVisibility(R.id.widget_team_home, View.GONE)
            views.setViewVisibility(R.id.widget_team_away, View.GONE)
            views.setViewVisibility(R.id.widget_meta, View.GONE)
            views.setViewVisibility(R.id.widget_caption, View.GONE)
            views.setViewVisibility(R.id.widget_cup_chip, View.GONE)
            views.setViewVisibility(R.id.widget_empty, View.VISIBLE)
            views.setTextViewText(R.id.widget_empty, emptyText)
            views.setViewVisibility(R.id.widget_chronometer, View.GONE)
            views.setViewVisibility(R.id.widget_countdown, View.GONE)
        }

        // Tapping anywhere opens the app; with a fixture the calendar
        // deep-links into that match's sheet (same eventKey format the
        // push notifications use).
        val uri = if (showMatch && eventKey.isNotEmpty()) {
            Uri.parse("redrebels://widget?eventKey=${Uri.encode(eventKey)}")
        } else {
            Uri.parse("redrebels://widget")
        }
        views.setOnClickPendingIntent(
            R.id.widget_root,
            HomeWidgetLaunchIntent.getActivity(context, MainActivity::class.java, uri),
        )

        manager.updateAppWidget(appWidgetId, views)
    }

    /**
     * Countdown display, chronometer-hybrid (stakeholder choice 2026-07-16):
     * beyond 24h the text form ("⏱ 38d 4h") refreshes on the 30-min cycle;
     * inside the final 24h a system-ticked [android.widget.Chronometer]
     * counts down live (per second, no app wakeups). Falls back to text on
     * pre-N devices, and hides everything once kickoff has passed (the
     * ≤2h grace window keeps the fixture itself visible).
     */
    private fun bindCountdown(views: RemoteViews, remaining: Long, units: String, captionId: Int?) {
        val liveTick = remaining in 1..DAY_MILLIS && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
        val text = if (liveTick) null else formatCountdown(remaining, units)

        views.setViewVisibility(R.id.widget_chronometer, if (liveTick) View.VISIBLE else View.GONE)
        views.setViewVisibility(R.id.widget_countdown, if (text == null) View.GONE else View.VISIBLE)
        if (captionId != null) {
            views.setViewVisibility(captionId, if (liveTick || text != null) View.VISIBLE else View.GONE)
        }

        if (liveTick) {
            views.setChronometerCountDown(R.id.widget_chronometer, true)
            views.setChronometer(
                R.id.widget_chronometer,
                SystemClock.elapsedRealtime() + remaining,
                "⏱ %s",
                true,
            )
        } else {
            views.setTextViewText(R.id.widget_countdown, text ?: "")
        }
    }

    companion object {
        /**
         * Loads a team crest from the Flutter asset pack (payload paths like
         * `assets/images/team_logos/ΑΠΟΕΛ.webp`), downscaled for the 30dp
         * slot. Null on any failure — callers fall back to text.
         */
        fun loadCrest(context: Context, assetPath: String): Bitmap? {
            if (assetPath.isEmpty()) return null
            // Flutter percent-encodes non-ASCII asset names inside the APK
            // (ΝΕΑ_ΣΑΛΑΜΙΝΑ.webp → %CE%9D...), so encode each segment.
            val encoded = assetPath.split('/').joinToString("/") { Uri.encode(it) }
            return try {
                context.assets.open("flutter_assets/$encoded").use { stream ->
                    val raw = BitmapFactory.decodeStream(stream) ?: return null
                    val target = (34 * context.resources.displayMetrics.density).toInt()
                    if (raw.width <= target) raw
                    else Bitmap.createScaledBitmap(
                        raw, target, target * raw.height / raw.width, true)
                }
            } catch (_: Exception) {
                null
            }
        }

        /** Design spec: panel raked 17° off vertical. */
        private const val RAKE_DEGREES = 17.0

        /** Panel width share of the card (design: 140/320, 4×1 110/320). */
        const val PANEL_SHARE = 0.4375f
        const val COMPACT_PANEL_SHARE = 0.34f

        private const val DAY_MILLIS = 24 * 60 * 60 * 1000L

        /**
         * Card background: #1A0F0F rounded surface, raked solid panel and
         * the 2dp darker seam along its edge. Drawn at the widget's actual
         * size so the diagonal stays crisp through launcher resizes.
         */
        fun renderBackground(
            context: Context,
            widthDp: Int,
            heightDp: Int,
            compact: Boolean,
            panelColor: Int,
            seamColor: Int,
        ): Bitmap {
            val density = context.resources.displayMetrics.density
            // Cap to keep the RemoteViews bitmap comfortably under the
            // transaction/memory budget even on absurd resizes.
            val w = (widthDp.coerceIn(120, 800) * density).toInt()
            val h = (heightDp.coerceIn(50, 500) * density).toInt()
            val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)

            val radius = 16f * density
            val surface = Path().apply {
                addRoundRect(RectF(0f, 0f, w.toFloat(), h.toFloat()), radius, radius, Path.Direction.CW)
            }
            canvas.clipPath(surface)
            canvas.drawColor(0xFF1A0F0F.toInt())

            // Panel bottom-left x: 4×2 uses the design's 140/320 share,
            // 4×1 narrows to 110/320. Top edge leans right by h·tan(17°).
            val panelShare = if (compact) COMPACT_PANEL_SHARE else PANEL_SHARE
            val panelLeft = w - w * panelShare
            val rake = (h * tan(Math.toRadians(RAKE_DEGREES))).toFloat()

            val paint = Paint(Paint.ANTI_ALIAS_FLAG)
            paint.color = panelColor
            val panel = Path().apply {
                moveTo(panelLeft + rake, 0f)
                lineTo(w.toFloat(), 0f)
                lineTo(w.toFloat(), h.toFloat())
                lineTo(panelLeft, h.toFloat())
                close()
            }
            canvas.drawPath(panel, paint)

            paint.color = seamColor
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = 2f * density
            canvas.drawLine(panelLeft + rake, 0f, panelLeft, h.toFloat(), paint)

            return bitmap
        }

        /**
         * Web useCountdown cadence with per-language unit letters
         * ("dhm" / Greek "ηωλ"); null once kickoff has passed.
         */
        fun formatCountdown(remainingMillis: Long, units: String): String? {
            if (remainingMillis < 0) return null
            val u = if (units.length == 3) units else "dhm"
            val minutesTotal = remainingMillis / 60_000
            val days = minutesTotal / (60 * 24)
            val hours = (minutesTotal % (60 * 24)) / 60
            val minutes = minutesTotal % 60
            return when {
                days > 0 -> "⏱ ${days}${u[0]} ${hours}${u[1]}"
                hours > 0 -> "⏱ ${hours}${u[1]} ${minutes}${u[2]}"
                else -> "⏱ ${minutes}${u[2]}"
            }
        }
    }
}
