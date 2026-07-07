import { matchesCron, ParsedCron, parseCronExpression } from './cron.js'
import { intervalScheduleMs, isCronSchedule, Schedule } from './types.js'

const MINUTE_MS = 60_000
/**
 * Upper bound on how far back a cron due-check scans when the last run is missing or ancient. Keeps
 * a first-ever run (or one after long downtime) from looping over years of minutes; it fires once for
 * a recent match and then resumes normal cadence.
 */
const MAX_SCAN_MINUTES = 60 * 24 * 2 // 2 days

const startOfMinute = (time: number): number => Math.floor(time / MINUTE_MS) * MINUTE_MS

/**
 * Whether a cron schedule is due at `now` given the last run. Scans minute-by-minute from just after
 * the last run up to `now` (UTC), so a coarse base tick or a short outage still fires each matching
 * minute exactly once — never twice within the same minute. With no prior run only the current minute
 * is considered, so a fresh deploy does not replay history.
 */
const isCronDue = (parsed: ParsedCron, lastRunAt: Date | null, now: Date): boolean => {
	const nowMinute = startOfMinute(now.getTime())
	let cursor = lastRunAt === null ? nowMinute : startOfMinute(lastRunAt.getTime()) + MINUTE_MS
	const earliest = nowMinute - MAX_SCAN_MINUTES * MINUTE_MS
	if (cursor < earliest) {
		cursor = earliest
	}
	for (; cursor <= nowMinute; cursor += MINUTE_MS) {
		if (matchesCron(parsed, new Date(cursor))) {
			return true
		}
	}
	return false
}

const isIntervalDue = (intervalMs: number, lastRunAt: Date | null, now: Date): boolean => {
	if (lastRunAt === null) {
		return true
	}
	return now.getTime() - lastRunAt.getTime() >= intervalMs
}

/**
 * Whether the given schedule is due to fire at `now`, given the timestamp of its last run
 * (`null` when it has never run). Pure and side-effect-free — the scheduler's core due-check.
 */
export const isScheduleDue = (schedule: Schedule, lastRunAt: Date | null, now: Date): boolean => {
	if (isCronSchedule(schedule)) {
		return isCronDue(parseCronExpression(schedule.cron), lastRunAt, now)
	}
	return isIntervalDue(intervalScheduleMs(schedule), lastRunAt, now)
}
