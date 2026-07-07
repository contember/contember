import { Model, Retention } from '@contember/schema'
import { isColumn } from '@contember/schema-utils'
import { Client, DeleteBuilder, SelectBuilder, wrapIdentifier } from '@contember/database'
import { PathFactory, WhereBuilder } from '@contember/engine-content-api'

export interface RetentionLimits {
	/** Per-batch `LIMIT`. */
	readonly batchSize: number
	/** Safety cap on total rows deleted in one run. */
	readonly maxPerRun: number
}

/** Root FROM alias of the retention SELECT; must match the {@link PathFactory} root alias (`root_`). */
const ROOT_ALIAS = 'root_'

const resolveOlderThanColumn = (entity: Model.Entity, policy: Retention.Policy): string => {
	const olderThan = policy.olderThan
	if (!olderThan) {
		throw new Error('resolveOlderThanColumn called without an olderThan predicate')
	}
	const field = entity.fields[olderThan.field]
	if (!field || !isColumn(field) || field.type !== Model.ColumnType.DateTime) {
		throw new Error(
			`Retention policy "${policy.name}": olderThan.field "${olderThan.field}" must be a DateTime column of "${entity.name}".`,
		)
	}
	return field.columnName
}

/**
 * Builds the SELECT that picks one batch of primary keys to prune: the policy's `where` (literal-valued,
 * compiled by the content {@link WhereBuilder}) ANDed with the `olderThan` cutoff, capped by `LIMIT`.
 *
 * The interval is bound as a text parameter and cast to `interval` in SQL (`now() - cast(? as interval)`)
 * — never string-concatenated, so a policy interval can't inject SQL. At least one predicate is required;
 * a predicate-less policy would delete the whole table, so this throws instead.
 */
export const buildRetentionSelect = (
	whereBuilder: WhereBuilder,
	pathFactory: PathFactory,
	entity: Model.Entity,
	policy: Retention.Policy,
	batchSize: number,
): SelectBuilder<SelectBuilder.Result> => {
	if (policy.olderThan === undefined && policy.where === undefined) {
		throw new Error(
			`Retention policy "${policy.name}" on "${entity.name}" has neither "olderThan" nor "where"; refusing to delete the entire table.`,
		)
	}

	let qb: SelectBuilder<SelectBuilder.Result> = SelectBuilder.create()
		.from(entity.tableName, ROOT_ALIAS)
		.select([ROOT_ALIAS, entity.primaryColumn])
		.limit(batchSize)

	if (policy.where !== undefined) {
		qb = whereBuilder.build(qb, entity, pathFactory.create([]), policy.where)
	}
	if (policy.olderThan !== undefined) {
		const columnName = resolveOlderThanColumn(entity, policy)
		const interval = policy.olderThan.interval
		qb = qb.where(expr => expr.raw(`${wrapIdentifier(ROOT_ALIAS)}.${wrapIdentifier(columnName)} < now() - cast(? as interval)`, interval))
	}
	return qb
}

/** Builds the batched `DELETE FROM t WHERE <primary> IN (<select batch>)` for a retention policy. */
export const buildRetentionDelete = (
	entity: Model.Entity,
	select: SelectBuilder<SelectBuilder.Result>,
): DeleteBuilder<DeleteBuilder.AffectedRows> =>
	DeleteBuilder.create()
		.from(entity.tableName)
		.where(expr => expr.in(entity.primaryColumn, select))

/**
 * The batch loop, factored out from I/O so it is unit-testable. Calls `runBatch(batchSize)` until a
 * batch prunes fewer rows than its `LIMIT` (nothing left) or the `maxPerRun` cap is reached; each batch
 * is shrunk so the run never deletes more than `maxPerRun`. Returns the total number of rows deleted.
 */
export const runRetentionBatches = async (
	limits: RetentionLimits,
	runBatch: (batchSize: number) => Promise<number>,
): Promise<number> => {
	let totalDeleted = 0
	while (totalDeleted < limits.maxPerRun) {
		const batchSize = Math.min(limits.batchSize, limits.maxPerRun - totalDeleted)
		const affected = await runBatch(batchSize)
		totalDeleted += affected
		if (affected < batchSize) {
			break
		}
	}
	return totalDeleted
}

/**
 * Runs the `raw` retention strategy: a batched SQL `DELETE` that bypasses ACL and the content
 * immutability gate by construction (raw SQL, engine-internal) — the same trust model as the audit-log
 * writer. Postgres FK actions (cascade / set-null / junction cleanup) fire at the DB level, and the
 * event-log trigger fires unless the entity opted out. `content` strategy is phase 4.
 */
export class RawRetentionExecutor {
	constructor(
		private readonly whereBuilder: WhereBuilder,
		private readonly pathFactory: PathFactory,
	) {
	}

	/**
	 * Deletes matching rows in batches against `client` (already scoped to the target stage schema) until
	 * a batch prunes fewer rows than its `LIMIT` (nothing left) or `maxPerRun` is reached. Returns the
	 * total number of rows deleted.
	 */
	public async execute(client: Client, entity: Model.Entity, policy: Retention.Policy, limits: RetentionLimits): Promise<number> {
		return runRetentionBatches(limits, batchSize => {
			const select = buildRetentionSelect(this.whereBuilder, this.pathFactory, entity, policy, batchSize)
			return buildRetentionDelete(entity, select).execute(client)
		})
	}
}
