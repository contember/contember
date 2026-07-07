import { Model, Retention, Schema } from '@contember/schema'
import { getEntity } from '@contember/schema-utils'
import { Stage, StagesQuery } from '@contember/engine-system-api'
import { createWhereBuilder, ExecutionContainerFactory, PathFactory } from '@contember/engine-content-api'
import { DatabaseMetadataResolver } from '@contember/database'
import { isScheduleDue, ScheduledJob, ScheduledJobContext } from '@contember/engine-scheduler'
import { RawRetentionExecutor, RetentionLimits } from './RawRetentionExecutor.js'
import { ContentRetentionContext, ContentRetentionExecutor } from './ContentRetentionExecutor.js'
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
 * schedule (falling back to the configured default). It runs the strategy-selected executor per due
 * (policy, stage), records the run — advancing last-run on success *and* error so a failing policy backs
 * off to its next window rather than retrying every tick.
 */
export class RetentionJob implements ScheduledJob {
	public readonly name = RETENTION_JOB_NAME
	// No `schedule`: due-ness is decided per policy/stage inside `run`.

	private readonly databaseMetadataResolver = new DatabaseMetadataResolver()

	constructor(
		private readonly getConfig: () => RetentionConfig,
		private readonly getMetrics: () => RetentionMetrics | undefined,
		/** Master-singleton content-execution factory (with plugin hooks applied); required for the `content` strategy. */
		private readonly getExecutionContainerFactory: () => ExecutionContainerFactory | undefined,
	) {
	}

	public async run(ctx: ScheduledJobContext): Promise<void> {
		const { schema, meta } = await ctx.contentSchemaResolver.getSchema({ db: ctx.db })
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
		const pathFactory = new PathFactory()
		const rawExecutor = new RawRetentionExecutor(whereBuilder, pathFactory)
		const executionContainerFactory = this.getExecutionContainerFactory()
		const contentExecutor = executionContainerFactory !== undefined
			? new ContentRetentionExecutor(executionContainerFactory, whereBuilder, pathFactory)
			: undefined
		const metrics = this.getMetrics()?.forProject(ctx.projectSlug)

		for (const policy of policies) {
			const schedule = policy.schedule !== undefined ? toSchedulerSchedule(policy.schedule) : config.defaultSchedule
			for (const stage of stages) {
				const subKey = runSubKey(policy.name, stage.slug)
				const last = await ctx.runStore.getLastRun(this.name, subKey)
				if (!isScheduleDue(schedule, last?.lastRunAt ?? null, ctx.now)) {
					continue
				}
				await this.runPolicyStage(ctx, schema, meta.id, rawExecutor, contentExecutor, policy, stage, config, metrics, subKey)
			}
		}
	}

	private async runPolicyStage(
		ctx: ScheduledJobContext,
		schema: Schema,
		schemaMetaId: number | undefined,
		rawExecutor: RawRetentionExecutor,
		contentExecutor: ContentRetentionExecutor | undefined,
		policy: Retention.Policy,
		stage: Stage,
		config: RetentionConfig,
		metrics: ProjectRetentionMetrics | undefined,
		subKey: string,
	): Promise<void> {
		const start = process.hrtime.bigint()
		const durationSeconds = () => Number(process.hrtime.bigint() - start) / 1e9
		try {
			const entity = getEntity(schema.model, policy.entity)
			const limits: RetentionLimits = {
				batchSize: policy.batchSize ?? config.batchSize,
				maxPerRun: policy.maxPerRun ?? config.maxPerRun,
			}
			const deleted = policy.strategy === 'content'
				? await this.runContentStrategy(ctx, schema, schemaMetaId, contentExecutor, entity, policy, stage, limits)
				: await rawExecutor.execute(ctx.db.client.forSchema(stage.schema), entity, policy, limits)
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

	private async runContentStrategy(
		ctx: ScheduledJobContext,
		schema: Schema,
		schemaMetaId: number | undefined,
		contentExecutor: ContentRetentionExecutor | undefined,
		entity: Model.Entity,
		policy: Retention.Policy,
		stage: Stage,
		limits: RetentionLimits,
	): Promise<number> {
		if (contentExecutor === undefined) {
			throw new Error(
				`Retention policy "${policy.name}": strategy "content" requires the execution container factory, which is not available.`,
			)
		}
		const stageClient = ctx.db.client.forSchema(stage.schema)
		const schemaDatabaseMetadata = await this.databaseMetadataResolver.resolveMetadata(stageClient, stage.schema)
		const context: ContentRetentionContext = {
			schema,
			schemaMeta: { id: schemaMetaId },
			schemaDatabaseMetadata,
			stageClient,
			// The scheduler's `db` is the project's system database context, so its client schema is the system schema.
			systemSchema: ctx.db.client.schema,
			project: { slug: ctx.projectSlug },
			stage: { id: stage.id, slug: stage.slug },
		}
		return contentExecutor.execute(context, entity, policy, limits)
	}
}
