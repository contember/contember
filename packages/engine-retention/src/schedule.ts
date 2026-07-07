import { Retention } from '@contember/schema'
import { parseSchedule, Schedule } from '@contember/engine-scheduler'

/**
 * Adapts a schema-level {@link Retention.Schedule} into the scheduler's own {@link Schedule}. The two
 * are structurally identical, but `@contember/schema` intentionally stays engine-free, so the mapping
 * lives here. Reuses {@link parseSchedule} to re-validate (a bad cron / non-positive interval throws).
 */
export const toSchedulerSchedule = (schedule: Retention.Schedule): Schedule => {
	if ('cron' in schedule) {
		return parseSchedule(schedule.cron)
	}
	if ('everySeconds' in schedule) {
		return parseSchedule({ everySeconds: schedule.everySeconds })
	}
	return parseSchedule({ everyMinutes: schedule.everyMinutes })
}
