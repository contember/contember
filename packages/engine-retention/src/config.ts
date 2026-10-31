import { ServerConfig } from '@contember/engine-http'
import { parseSchedule, Schedule } from '@contember/engine-scheduler'

export interface RetentionConfig {
	/** Fallback schedule for policies that don't declare their own `schedule`. */
	readonly defaultSchedule: Schedule
	/** Default per-batch `LIMIT` for policies that omit `batchSize`. */
	readonly batchSize: number
	/** Default safety cap on rows deleted per policy per stage per run, for policies that omit `maxPerRun`. */
	readonly maxPerRun: number
}

const DEFAULT_SCHEDULE: Schedule = { everyMinutes: 60 }
const DEFAULT_BATCH_SIZE = 1000
const DEFAULT_MAX_PER_RUN = 100_000

/**
 * Resolves the raw `retention` section of the server config into a validated {@link RetentionConfig},
 * applying defaults. Throws on invalid values so misconfiguration fails fast at startup.
 */
export const resolveRetentionConfig = (config: ServerConfig['retention']): RetentionConfig => {
	const defaultSchedule = config?.defaultSchedule !== undefined ? parseSchedule(config.defaultSchedule) : DEFAULT_SCHEDULE
	const batchSize = config?.batchSize ?? DEFAULT_BATCH_SIZE
	if (!(batchSize > 0)) {
		throw new Error(`retention.batchSize must be a positive number, got ${batchSize}.`)
	}
	const maxPerRun = config?.maxPerRun ?? DEFAULT_MAX_PER_RUN
	if (!(maxPerRun > 0)) {
		throw new Error(`retention.maxPerRun must be a positive number, got ${maxPerRun}.`)
	}
	return { defaultSchedule, batchSize, maxPerRun }
}
