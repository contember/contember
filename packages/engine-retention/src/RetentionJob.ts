import { Retention, Schema } from '@contember/schema'
import { getEntity } from '@contember/schema-utils'
import { Stage, StagesQuery } from '@contember/engine-system-api'
import { createWhereBuilder, PathFactory } from '@contember/engine-content-api'
import { isScheduleDue, ScheduledJob, ScheduledJobContext } from '@contember/engine-scheduler'
import { RawRetentionExecutor, RetentionLimits } from './RawRetentionExecutor.js'
import { toSchedulerSchedule } from './schedule.js'
import { RetentionConfig } from './config.js'
import { ProjectRetentionMetrics, RetentionMetrics } from './RetentionMetrics.js'

/** Job name registered on the scheduler; also the `scheduler_run.job_name` key and the metric context. */
export const RETENTION_JOB_NAME = 'retention'

/** Separator for the composite `scheduler_run.stage` sub-key `${policyName}\x1f${stageSlug}`. */
const SUBKEY_SEPARATOR = '\x1f'

const runSubKey = (policyName: string, stageSlug: string): string => `${policyName}${SUBKEY_SEPARATOR}${stageSlug}`

/**
 * The single scheduler job that drives retention. It carries no top-level schedule, so the scheduler
 * invokes {@link run} on every base tick; the job itself decides due-ness per policy and per stage using
 * {@link ScheduledJobContext.runStore} (keyed by `${policyName}\x1f${stageSlug}`) and each policy's own
 * schedule (falling back to the configured default). It runs the `raw` executor per due (policy, stage),
 * records the run — advancing last-run on success *and* error so a failing policy backs off to its next
 * window rather than retrying every tick.
 */
export class RetentionJob implements ScheduledJob {
	public readonly name = RETENTION_JOB_NAME
	// No `schedule`: due-ness is decided per policy/stage inside `run`.

	constructor(
		private readonly getConfig: () => RetentionConfig,
		private readonly getMetrics: () => RetentionMetrics | undefined,
	) {
	}

	public async run(ctx: ScheduledJobContext): Promise<void> {
		const { schema } = await ctx.contentSchemaResolver.getSchema({ db: ctx.db })
		const policies = Object.values(schema.retention.policies)
		if (policies.length === 0) {
			return
		}
		const config = this.getConfig()
		const stages = await ctx.db.queryHandler.fetch(new StagesQuery())
		const whereBuilder = createWhereBuilder(
			schema.model,
			(schema.settings.content?.useExistsInHasManyFilter ?? schema.settings.useExistsInHasManyFilter) === true,
		)
		const executor = new RawRetentionExecutor(whereBuilder, new PathFactory())
		const metrics = this.getMetrics()?.forProject(ctx.projectSlug)

		for (const policy of policies) {
			const schedule = policy.schedule !== undefined ? toSchedulerSchedule(policy.schedule) : config.defaultSchedule
			for (const stage of stages) {
				const subKey = runSubKey(policy.name, stage.slug)
				const last = await ctx.runStore.getLastRun(this.name, subKey)
				if (!isScheduleDue(schedule, last?.lastRunAt ?? null, ctx.now)) {
					continue
				}
				await this.runPolicyStage(ctx, schema, executor, policy, stage, config, metrics, subKey)
			}
		}
	}

	private async runPolicyStage(
		ctx: ScheduledJobContext,
		schema: Schema,
		executor: RawRetentionExecutor,
		policy: Retention.Policy,
		stage: Stage,
		config: RetentionConfig,
		metrics: ProjectRetentionMetrics | undefined,
		subKey: string,
	): Promise<void> {
		const start = process.hrtime.bigint()
		const durationSeconds = () => Number(process.hrtime.bigint() - start) / 1e9
		try {
			if (policy.strategy === 'content') {
				throw new Error(
					`Retention policy "${policy.name}": strategy "content" is not yet implemented (phase 4). Use strategy "raw".`,
				)
			}
			const entity = getEntity(schema.model, policy.entity)
			const limits: RetentionLimits = {
				batchSize: policy.batchSize ?? config.batchSize,
				maxPerRun: policy.maxPerRun ?? config.maxPerRun,
			}
			const stageClient = ctx.db.client.forSchema(stage.schema)
			const deleted = await executor.execute(stageClient, entity, policy, limits)
			metrics?.recordDeleted(policy.entity, policy.name, deleted)
			metrics?.recordRun(policy.name, durationSeconds())
			ctx.logger.info('Retention policy run complete', { policy: policy.name, stage: stage.slug, deleted })
			await ctx.runStore.recordRun(this.name, 'ok', subKey, ctx.now)
		} catch (e) {
			metrics?.recordRun(policy.name, durationSeconds())
			metrics?.recordError(policy.name)
			ctx.logger.error(e, { message: 'Retention policy run failed', policy: policy.name, stage: stage.slug })
			await ctx.runStore.recordRun(this.name, 'error', subKey, ctx.now)
		}
	}
}
