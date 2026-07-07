import { ServerConfig } from '@contember/engine-http'
import { parseSchedule, Schedule } from './schedule/types.js'

export interface SchedulerConfig {
	/** Whether the scheduler worker is registered at all. */
	readonly enabled: boolean
	/** How often (ms) each project loop re-evaluates its jobs; per-job schedules gate actual firing. */
	readonly baseTickMs: number
	/** Fallback schedule for jobs/policies that don't declare one (consumed by dependent plugins). */
	readonly defaultSchedule: Schedule
}

const DEFAULT_BASE_TICK_SECONDS = 60
const DEFAULT_SCHEDULE: Schedule = { everyMinutes: 60 }

/**
 * Resolves the raw `scheduler` section of the server config into a validated {@link SchedulerConfig},
 * applying defaults. Throws on invalid values so misconfiguration fails fast at startup.
 */
export const resolveSchedulerConfig = (config: ServerConfig['scheduler']): SchedulerConfig => {
	const enabled = config?.enabled ?? true
	const baseTickSeconds = config?.baseTickSeconds ?? DEFAULT_BASE_TICK_SECONDS
	if (!(baseTickSeconds > 0)) {
		throw new Error(`scheduler.baseTickSeconds must be a positive number, got ${baseTickSeconds}.`)
	}
	const defaultSchedule = config?.defaultSchedule !== undefined ? parseSchedule(config.defaultSchedule) : DEFAULT_SCHEDULE
	return {
		enabled,
		baseTickMs: baseTickSeconds * 1000,
		defaultSchedule,
	}
}
