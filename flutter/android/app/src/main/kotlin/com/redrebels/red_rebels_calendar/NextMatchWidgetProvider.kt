package com.redrebels.red_rebels_calendar

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetLaunchIntent
import es.antonborri.home_widget.HomeWidgetPlugin

/**
 * Next-match home-screen widget (Phase 9, PRD N-2).
 *
 * Renders the payload written by the Flutter side
 * (lib/logic/home_widget_updater.dart) — all strings arrive pre-localized;
 * only the countdown is computed here so the 30-minute
 * [android.appwidget.AppWidgetProviderInfo.updatePeriodMillis] re-render
 * keeps it ticking without waking the app. Countdown format mirrors the
 * web's useCountdown hook (⏱ 3d 4h / ⏱ 4h 12m / ⏱ 12m).
 */
class NextMatchWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        val prefs = HomeWidgetPlugin.getData(context)
        val hasMatch = prefs.getBoolean("hasMatch", false)
        val label = prefs.getString("label", "NEXT MATCH")
        val title = prefs.getString("title", "")
        val subtitle = prefs.getString("subtitle", "")
        val emptyText = prefs.getString("emptyText", "")
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

        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_next_match)
            views.setTextViewText(R.id.widget_label, label)

            if (showMatch) {
                views.setViewVisibility(R.id.widget_title, View.VISIBLE)
                views.setViewVisibility(R.id.widget_subtitle, View.VISIBLE)
                views.setViewVisibility(R.id.widget_empty, View.GONE)
                views.setTextViewText(R.id.widget_title, title)
                views.setTextViewText(R.id.widget_subtitle, subtitle)
                val countdown = formatCountdown(remaining)
                views.setViewVisibility(
                    R.id.widget_countdown,
                    if (countdown == null) View.GONE else View.VISIBLE,
                )
                views.setTextViewText(R.id.widget_countdown, countdown ?: "")
            } else {
                views.setViewVisibility(R.id.widget_title, View.GONE)
                views.setViewVisibility(R.id.widget_subtitle, View.GONE)
                views.setViewVisibility(R.id.widget_countdown, View.GONE)
                views.setViewVisibility(R.id.widget_empty, View.VISIBLE)
                views.setTextViewText(R.id.widget_empty, emptyText)
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

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    companion object {
        /** Web useCountdown parity; null once kickoff has passed. */
        fun formatCountdown(remainingMillis: Long): String? {
            if (remainingMillis < 0) return null
            val minutesTotal = remainingMillis / 60_000
            val days = minutesTotal / (60 * 24)
            val hours = (minutesTotal % (60 * 24)) / 60
            val minutes = minutesTotal % 60
            return when {
                days > 0 -> "⏱ ${days}d ${hours}h"
                hours > 0 -> "⏱ ${hours}h ${minutes}m"
                else -> "⏱ ${minutes}m"
            }
        }
    }
}
