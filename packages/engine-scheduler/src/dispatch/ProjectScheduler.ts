import { DatabaseContext } from '@contember/engine-system-api'
import { ContentSchemaResolver } from '@contember/engine-http'
import { Runnable, RunnableArgs, Running } from '@contember/engine-common'
import { Logger } from '@contember/logger'
import { ScheduledJobRegistry } from '../registry/ScheduledJobRegistry.js'
import { ScheduledJob } from '../registry/types.js'
import { ProjectSchedulerMetrics, SchedulerMetrics } from '../SchedulerMetrics.js'
import { SchedulerRunStore } from './SchedulerRunStore.js'
import { advisoryUnlock, schedulerLockId, tryAdvisoryLock } from './advisoryLock.js'
import { isScheduleDue } from '../schedule/isDue.js'

export class ProjectSchedulerFactory {
	constructor(
		private readonly registry: ScheduledJobRegistry,
		private readonly metrics: SchedulerMetrics,
		private readonly baseTickMs: number,
	) {
	}

	public create(
		{ db, contentSchemaResolver, projectSlug }: { db: DatabaseContext; contentSchemaResolver: ContentSchemaResolver; projectSlug: string },
	): ProjectScheduler {
		return new ProjectScheduler(
			this.registry,
			this.metrics.forProject(projectSlug),
			this.baseTickMs,
			db,
			contentSchemaResolver,
			projectSlug,
		)
	}
}

/**
 * Per-project time-driven loop. On each base tick it evaluates every registered job under a
 * per-(project, job) advisory lock so only one cluster node runs a given job. Per-job `run` failures
 * are caught, logged and counted; only infrastructure failures (e.g. a dropped connection) propagate
 * to crash the loop, which the supervisor then restarts with backoff.
 */
export class ProjectScheduler implements Runnable {
	constructor(
		private readonly registry: ScheduledJobRegistry,
		private readonly metrics: ProjectSchedulerMetrics,
		private readonly baseTickMs: number,
		private readonly db: DatabaseContext,
		private readonly contentSchemaResolver: ContentSchemaResolver,
		private readonly projectSlug: string,
	) {
	}

	public async run({ logger, onError, onClose }: RunnableArgs): Promise<Running> {
		let aborted = false
		let wake: () => void = () => {}

		const loop = (async () => {
			try {
				while (!aborted) {
					this.metrics.heartbeat()
					await this.runDueJobs(logger, () => aborted)
					if (aborted) {
						break
					}
					// Park until the next base tick; `wake` cuts it short on shutdown.
					await new Promise<void>(resolve => {
						const handle = setTimeout(resolve, this.baseTickMs)
						wake = () => {
							clearTimeout(handle)
							resolve()
						}
					})
				}
				onClose?.()
			} catch (e) {
				this.metrics.crashed()
				onError(e)
			}
		})()

		return {
			end: async () => {
				aborted = true
				wake()
				await loop
				this.metrics.dispose()
				logger.info('Scheduler worker terminated', { project: this.projectSlug })
			},
		}
	}

	private async runDueJobs(logger: Logger, isAborted: () => boolean): Promise<void> {
		const now = new Date()
		for (const job of this.registry.list()) {
			if (isAborted()) {
				return
			}
			await this.runJob(job, now, logger)
		}
	}

	private async runJob(job: ScheduledJob, now: Date, logger: Logger): Promise<void> {
		const lockId = schedulerLockId(this.projectSlug, job.name)
		await this.db.scope(async scoped => {
			const locked = await tryAdvisoryLock(scoped.client, lockId)
			if (!locked) {
				logger.debug('Scheduled job held by another node, skipping', { job: job.name, project: this.projectSlug })
				return
			}
			try {
				const runStore = new SchedulerRunStore(scoped, this.projectSlug)
				if (job.schedule) {
					const last = await runStore.getLastRun(job.name)
					if (!isScheduleDue(job.schedule, last?.lastRunAt ?? null, now)) {
						return
					}
				}
				const start = process.hrtime.bigint()
				const durationSeconds = () => Number(process.hrtime.bigint() - start) / 1e9
				try {
					await job.run({
						projectSlug: this.projectSlug,
						db: scoped,
						contentSchemaResolver: this.contentSchemaResolver,
						now,
						logger: logger.child({ schedulerJob: job.name }),
						runStore,
					})
					this.metrics.jobRun(job.name, durationSeconds())
					await runStore.recordRun(job.name, 'ok', undefined, now)
				} catch (e) {
					this.metrics.jobRun(job.name, durationSeconds())
					this.metrics.jobFailed(job.name)
					logger.error(e, { message: 'Scheduled job failed', job: job.name, project: this.projectSlug })
					await runStore.recordRun(job.name, 'error', undefined, now)
				}
			} finally {
				await advisoryUnlock(scoped.client, lockId)
			}
		})
	}
}
