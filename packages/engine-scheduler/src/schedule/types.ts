import { parseCronExpression } from './cron.js'

/**
 * A job's firing schedule. Either a fixed interval (fires once the elapsed time since the last run
 * reaches the interval) or a 5-field cron expression (fires on matching wall-clock minutes, UTC).
 */
export type IntervalSchedule =
	| { readonly everySeconds: number }
	| { readonly everyMinutes: number }

export type CronSchedule = { readonly cron: string }

export type Schedule = IntervalSchedule | CronSchedule

/** Loose input accepted from configuration / schema: a bare cron string, or an interval object. */
export type ScheduleInput = string | { readonly everySeconds?: number; readonly everyMinutes?: number }

export const isCronSchedule = (schedule: Schedule): schedule is CronSchedule => 'cron' in schedule

/** Length of an interval schedule in milliseconds. */
export const intervalScheduleMs = (schedule: IntervalSchedule): number =>
	'everySeconds' in schedule ? schedule.everySeconds * 1000 : schedule.everyMinutes * 60_000

/**
 * Normalizes and validates loose schedule input into a {@link Schedule}. Throws on an invalid cron
 * string or a non-positive interval, so misconfiguration fails fast at startup rather than at tick time.
 */
export const parseSchedule = (input: ScheduleInput): Schedule => {
	if (typeof input === 'string') {
		const cron = input.trim()
		// Validate now; parse errors surface here rather than on the first tick.
		parseCronExpression(cron)
		return { cron }
	}
	if (typeof input.everySeconds === 'number') {
		if (!(input.everySeconds > 0)) {
			throw new Error(`Invalid schedule: everySeconds must be a positive number, got ${input.everySeconds}.`)
		}
		return { everySeconds: input.everySeconds }
	}
	if (typeof input.everyMinutes === 'number') {
		if (!(input.everyMinutes > 0)) {
			throw new Error(`Invalid schedule: everyMinutes must be a positive number, got ${input.everyMinutes}.`)
		}
		return { everyMinutes: input.everyMinutes }
	}
	throw new Error('Invalid schedule: expected a cron string or an { everySeconds } / { everyMinutes } interval.')
}
