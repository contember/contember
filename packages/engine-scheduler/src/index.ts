import { Plugin } from '@contember/engine-plugins'
import { MasterContainerHook } from '@contember/engine-http'
import { MigrationGroup } from '@contember/database-migrations'
import { migrationsGroup } from './migrations/index.js'
import { ScheduledJobRegistry } from './registry/ScheduledJobRegistry.js'
import { SchedulerMetrics } from './SchedulerMetrics.js'
import { ProjectSchedulerFactory } from './dispatch/ProjectScheduler.js'
import { SchedulerWorkerSupervisorFactory } from './dispatch/SchedulerWorkerSupervisor.js'
import { LazySchedulerWorker } from './dispatch/LazySchedulerWorker.js'
import { resolveSchedulerConfig } from './config.js'

export { ScheduledJobRegistry } from './registry/ScheduledJobRegistry.js'
export type { ScheduledJob, ScheduledJobContext } from './registry/types.js'
export { JOB_LEVEL_STAGE, SchedulerRunStore } from './dispatch/SchedulerRunStore.js'
export type { SchedulerRun } from './dispatch/SchedulerRunStore.js'
export { isScheduleDue } from './schedule/isDue.js'
export { intervalScheduleMs, isCronSchedule, parseSchedule } from './schedule/types.js'
export type { CronSchedule, IntervalSchedule, Schedule, ScheduleInput } from './schedule/types.js'
export { matchesCron, parseCronExpression } from './schedule/cron.js'
export type { CronField, ParsedCron } from './schedule/cron.js'
export { resolveSchedulerConfig } from './config.js'
export type { SchedulerConfig } from './config.js'
export { ProjectSchedulerMetrics, SchedulerMetrics } from './SchedulerMetrics.js'

/**
 * Generic internal cron scheduler. Other plugins (e.g. `engine-retention`) register periodic
 * {@link ScheduledJob}s on {@link SchedulerPlugin.registry}; the scheduler owns timing — a low base
 * tick per project, a per-(project, job) advisory lock for cluster safety, and a `scheduler_run`
 * system table so due-checks survive restarts. It knows nothing about what any job does.
 */
export default class SchedulerPlugin implements Plugin {
	name = 'contember/scheduler'

	/** Shared job registry; pass to dependent plugins so they can register jobs (see `loadPlugins`). */
	public readonly registry = new ScheduledJobRegistry()

	getSystemMigrations(): MigrationGroup {
		return migrationsGroup
	}

	getMasterContainerHook(): MasterContainerHook {
		const registry = this.registry
		const workerName = this.name
		return builder =>
			builder.setupService(
				'applicationWorkers',
				(applicationWorkers, { promRegistry, serverConfig, projectGroupContainer, projectGroupContainerResolver }) => {
					const config = resolveSchedulerConfig(serverConfig.scheduler)
					if (!config.enabled) {
						return
					}
					const metrics = new SchedulerMetrics(promRegistry)
					const projectSchedulerFactory = new ProjectSchedulerFactory(registry, metrics, config.baseTickMs)
					const supervisorFactory = new SchedulerWorkerSupervisorFactory(projectSchedulerFactory)
					if (!serverConfig.projectGroup) {
						applicationWorkers.registerWorker(workerName, supervisorFactory.create(projectGroupContainer))
					} else {
						applicationWorkers.registerWorker(workerName, new LazySchedulerWorker(projectGroupContainerResolver, supervisorFactory))
					}
				},
			)
	}
}
