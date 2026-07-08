import { ConflictActionType, InsertBuilder, SelectBuilder } from '@contember/database'
import { DatabaseContext } from '@contember/engine-system-api'

export interface SchedulerRun {
	readonly jobName: string
	readonly stage: string
	readonly lastRunAt: Date
	readonly lastStatus: string
}

interface SchedulerRunRow {
	readonly job_name: string
	readonly stage: string
	readonly last_run_at: Date
	readonly last_status: string
}

/** Stage key for a whole-project (job-level) run; individual stages use their own slug. */
export const JOB_LEVEL_STAGE = ''

/**
 * Persistent access to the `scheduler_run` system table (per project system schema). Records the last
 * run of each `(job, stage)` so cron/interval due-checks survive restarts. The scheduler uses it for
 * job-level runs; a job with finer-grained schedules (e.g. retention, per policy and stage) reuses it
 * via {@link ScheduledJobContext.runStore} keyed by its own name/stage.
 */
export class SchedulerRunStore {
	constructor(
		private readonly db: DatabaseContext,
		private readonly projectSlug: string,
	) {
	}

	public async getLastRun(jobName: string, stage: string = JOB_LEVEL_STAGE): Promise<SchedulerRun | null> {
		const rows = await SelectBuilder.create<SchedulerRunRow>()
			.from('scheduler_run')
			.select('job_name')
			.select('stage')
			.select('last_run_at')
			.select('last_status')
			.where({ project: this.projectSlug, job_name: jobName, stage })
			.getResult(this.db.client)
		const row = rows[0]
		if (!row) {
			return null
		}
		return {
			jobName: row.job_name,
			stage: row.stage,
			lastRunAt: new Date(row.last_run_at),
			lastStatus: row.last_status,
		}
	}

	public async recordRun(jobName: string, status: string, stage: string = JOB_LEVEL_STAGE, at: Date = new Date()): Promise<void> {
		await InsertBuilder.create()
			.into('scheduler_run')
			.values({
				project: this.projectSlug,
				job_name: jobName,
				stage,
				last_run_at: at,
				last_status: status,
			})
			.onConflict(ConflictActionType.update, ['project', 'job_name', 'stage'], {
				last_run_at: at,
				last_status: status,
			})
			.execute(this.db.client)
	}
}
