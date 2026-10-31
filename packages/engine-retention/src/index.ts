import { Plugin } from '@contember/engine-plugins'
import { MasterContainerBuilder, MasterContainerHook } from '@contember/engine-http'
import { ExecutionContainerFactory } from '@contember/engine-content-api'
import { ScheduledJobRegistry } from '@contember/engine-scheduler'
import { RetentionJob } from './RetentionJob.js'
import { resolveRetentionConfig, RetentionConfig } from './config.js'
import { RetentionMetrics } from './RetentionMetrics.js'

export { RETENTION_JOB_NAME, RetentionJob } from './RetentionJob.js'
export { buildRetentionDelete, buildRetentionSelect, RawRetentionExecutor, runRetentionBatches } from './RawRetentionExecutor.js'
export type { RetentionLimits } from './RawRetentionExecutor.js'
export { ContentRetentionExecutor, interpretContentDeleteResult, SYSTEM_IDENTITY_ID } from './ContentRetentionExecutor.js'
export type { ContentRetentionContext } from './ContentRetentionExecutor.js'
export { resolveRetentionConfig } from './config.js'
export type { RetentionConfig } from './config.js'
export { toSchedulerSchedule } from './schedule.js'
export { ProjectRetentionMetrics, RetentionMetrics } from './RetentionMetrics.js'

/**
 * Retention plugin — prunes rows per `schema.retention` policies. Instead of owning a worker loop it
 * contributes a single job to the generic {@link https://npmjs.com/package/@contember/engine-scheduler | scheduler}
 * (constructed with the scheduler's registry), which drives timing and cluster-safe locking; the job
 * itself decides per-policy/per-stage due-ness. Metrics register on the shared Prometheus registry and
 * config resolves in the master-container hook — both exposed to the (earlier-registered) job via getters.
 * Only the `raw` delete strategy is implemented; `content` throws a not-implemented error (phase 4).
 */
export default class RetentionPlugin implements Plugin {
	name = 'contember/retention'

	/** Defaults until the master-container hook resolves the real config; the job reads it via a getter. */
	private config: RetentionConfig = resolveRetentionConfig(undefined)
	/** Set in the master-container hook (where the Prometheus registry is available); read back by the job. */
	private metrics: RetentionMetrics | undefined
	/** The shared, plugin-hooked content-execution factory; captured in the master hook, read back by the job for the `content` strategy. */
	private executionContainerFactory: ExecutionContainerFactory | undefined

	constructor(registry: ScheduledJobRegistry) {
		registry.register(new RetentionJob(() => this.config, () => this.metrics, () => this.executionContainerFactory))
	}

	getMasterContainerHook(): MasterContainerHook {
		return (builder: MasterContainerBuilder) =>
			// `applicationWorkers` is resolved eagerly at boot (before any tick), so this reliably resolves
			// config + metrics + the (hook-applied) execution container factory for the job, even though the
			// plugin registers no worker of its own. Capturing the factory reference is enough: its Actions
			// hook is pushed onto the same instance during boot and is present by the time a tick calls it.
			builder.setupService('applicationWorkers', (_applicationWorkers, { promRegistry, serverConfig, executionContainerFactory }) => {
				this.config = resolveRetentionConfig(serverConfig.retention)
				this.metrics = new RetentionMetrics(promRegistry)
				this.executionContainerFactory = executionContainerFactory
			})
	}
}
