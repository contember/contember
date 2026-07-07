import { Input, Model, Retention, Schema } from '@contember/schema'
import { AllowAllPermissionFactory } from '@contember/schema-utils'
import { Client, DatabaseMetadata } from '@contember/database'
import {
	CheckedPrimary,
	ExecutionContainerFactory,
	Mapper,
	MutationResultType,
	PathFactory,
	runContentMutationTransaction,
	WhereBuilder,
} from '@contember/engine-content-api'
import { buildRetentionSelect, RetentionLimits, runRetentionBatches } from './RawRetentionExecutor.js'

/**
 * Well-known zero-UUID "system" identity used for engine-internal maintenance deletes (mirrors
 * `MembershipResolver.UnknownIdentity`). With AllowAll permissions there are no ACL predicates, so
 * identity variables are irrelevant; this id only surfaces in the fired events — i.e. "system" pruned
 * the row, which is the correct/desirable attribution.
 */
export const SYSTEM_IDENTITY_ID = '00000000-0000-0000-0000-000000000000'

/** Per-(project, stage) inputs the {@link ContentRetentionExecutor} needs to build a privileged content context. */
export interface ContentRetentionContext {
	schema: Schema
	schemaMeta: { id?: number }
	schemaDatabaseMetadata: DatabaseMetadata
	/** Content DB client already scoped to the target stage schema. */
	stageClient: Client
	systemSchema: string
	project: { slug: string }
	stage: { id: string; slug: string }
}

/** Minimal shape of one mutation result the interpreter reads — structurally satisfied by the content API's `MutationResult`. */
interface RetentionDeleteResult {
	readonly error: boolean
	readonly result: MutationResultType
	readonly message?: string
}

/**
 * Interprets one per-row content delete result. Throws on a hard error (e.g. a `restrict` FK violation)
 * so the batch transaction rolls back and the job records the failure; otherwise returns whether the
 * root row was actually deleted — a lone `nothingToDo` means it was already removed earlier in the same
 * batch (e.g. via cascade/orphan removal), so it must not be double-counted.
 */
export const interpretContentDeleteResult = (
	result: readonly RetentionDeleteResult[],
	entity: Model.Entity,
	id: Input.PrimaryValue,
): boolean => {
	const errors = result.filter(it => it.error)
	if (errors.length > 0) {
		const detail = errors.map(it => it.message ?? it.result).join('; ')
		throw new Error(`Retention "content" delete failed for "${entity.name}" (${String(id)}): ${detail}`)
	}
	return !(result.length === 1 && result[0].result === MutationResultType.nothingToDo)
}

/**
 * Runs the `content` retention strategy: prunes matching rows through the content delete pipeline
 * (`Mapper.delete` → `DeleteExecutor`) under a system identity with full permissions (ACL bypass). Unlike
 * `raw`, this fires `EventManager` delete events — so Actions triggers (`@Watch`/`@Trigger`) and
 * synchronous audit rows persist — and honors app-level `removeOrphan`. FK cascade / set-null / junction
 * cleanup is DB-level in both strategies. The commit/event contract (`BeforeCommitEvent` → commit →
 * `AfterCommitEvent`, with serialization retry) is delegated to {@link runContentMutationTransaction}.
 */
export class ContentRetentionExecutor {
	constructor(
		private readonly executionContainerFactory: ExecutionContainerFactory,
		private readonly whereBuilder: WhereBuilder,
		private readonly pathFactory: PathFactory,
	) {
	}

	/**
	 * Deletes matching rows in batches until a batch selects fewer rows than its `LIMIT` (nothing left) or
	 * `maxPerRun` is reached. Each batch is one content transaction: select up to `batchSize` primary keys
	 * matching the predicate, then delete each through the pipeline. Returns the number of rows actually
	 * deleted (excluding in-batch cascade no-ops).
	 */
	public async execute(
		context: ContentRetentionContext,
		entity: Model.Entity,
		policy: Retention.Policy,
		limits: RetentionLimits,
	): Promise<number> {
		const permissions = new AllowAllPermissionFactory().create(context.schema.model, true)
		const executionContainer = this.executionContainerFactory.create({
			schema: context.schema,
			schemaMeta: context.schemaMeta,
			schemaDatabaseMetadata: context.schemaDatabaseMetadata,
			db: context.stageClient,
			identityId: SYSTEM_IDENTITY_ID,
			identityVariables: {},
			permissions,
			systemSchema: context.systemSchema,
			project: context.project,
			stage: context.stage,
			userInfo: { ipAddress: null, userAgent: null },
		})
		const mapperFactory = executionContainer.mapperFactory

		let totalDeleted = 0
		await runRetentionBatches(limits, async batchSize => {
			const { selected, deleted } = await runContentMutationTransaction(
				mapperFactory,
				mapper => this.deleteBatch(mapper, entity, policy, batchSize),
				(_result, error) => {
					throw error
				},
			)
			totalDeleted += deleted
			// Loop control uses the selected count (a full batch ⇒ maybe more to do), mirroring `raw`.
			return selected
		})
		return totalDeleted
	}

	private async deleteBatch(
		mapper: Mapper,
		entity: Model.Entity,
		policy: Retention.Policy,
		batchSize: number,
	): Promise<{ ok: true; selected: number; deleted: number }> {
		// Select inside the transaction so the ids are guaranteed present in the same snapshot the deletes read.
		const select = buildRetentionSelect(this.whereBuilder, this.pathFactory, entity, policy, batchSize)
		const rows: Record<string, Input.PrimaryValue>[] = await select.getResult(mapper.db)

		let deleted = 0
		for (const row of rows) {
			const id = row[entity.primaryColumn]
			const result = await mapper.delete(entity, new CheckedPrimary(id))
			if (interpretContentDeleteResult(result, entity, id)) {
				deleted++
			}
		}
		return { ok: true, selected: rows.length, deleted }
	}
}
