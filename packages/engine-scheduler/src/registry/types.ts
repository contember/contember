import { Logger } from '@contember/logger'
import { DatabaseContext } from '@contember/engine-system-api'
import { ContentSchemaResolver } from '@contember/engine-http'
import { Schedule } from '../schedule/types.js'
import { SchedulerRunStore } from '../dispatch/SchedulerRunStore.js'

export interface ScheduledJobContext {
	/** Slug of the project this tick runs for. */
	readonly projectSlug: string
	/**
	 * System database context for the project, scoped to the connection holding this job's advisory
	 * lock. Use it for reads/writes/transactions; the connection is released when the job returns.
	 */
	readonly db: DatabaseContext
	/** Resolves the project's content schema (per stage) — e.g. to locate entities and tables. */
	readonly contentSchemaResolver: ContentSchemaResolver
	/** Tick time; compare against a persisted last-run to decide what is due. */
	readonly now: Date
	readonly logger: Logger
	/**
	 * Persistent last-run store (`scheduler_run`) for this project. A job with finer-grained schedules
	 * (e.g. per-policy, per-stage) keys extra runs by name/stage so its due-checks survive restarts.
	 */
	readonly runStore: SchedulerRunStore
}

/**
 * A periodic job contributed by a plugin. The scheduler owns timing: on each base tick, per project,
 * it acquires a per-(project, job) advisory lock so only one cluster node runs the job.
 *
 * - With {@link schedule} set, {@link run} is invoked only on ticks where the schedule is due
 *   (computed from the schedule plus the persisted last-run).
 * - With {@link schedule} omitted, {@link run} is invoked on every base tick and the job itself
 *   decides what is due (e.g. iterating its own per-item schedules via {@link ScheduledJobContext.runStore}).
 */
export interface ScheduledJob {
	/** Stable, unique job name; also the `scheduler_run.job_name` key and the `job` metric label. */
	readonly name: string
	readonly schedule?: Schedule
	run(ctx: ScheduledJobContext): Promise<void>
}
