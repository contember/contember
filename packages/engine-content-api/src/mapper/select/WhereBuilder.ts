import { isIt } from '../../utils/index.js'
import { acceptFieldVisitor, isColumn } from '@contember/schema-utils'
import { Input, Model } from '@contember/schema'
import { hopPathSegment, Path, PathFactory } from './Path.js'
import { JoinBuilder } from './JoinBuilder.js'
import { ConditionBuilder } from './ConditionBuilder.js'
import {
	Compiler,
	ConditionBuilder as SqlConditionBuilder,
	Literal,
	Operator,
	QueryBuilder,
	SelectBuilder,
	wrapIdentifier,
} from '@contember/database'
import { WhereOptimizationHints, WhereOptimizer } from './optimizer/WhereOptimizer.js'
import { splitReadGuard } from '../../acl/PredicatesInjector.js'

/**
 * A user-authored relation hop: the remaining condition on the target rows and the target's row-level read
 * guard (see `READ_GUARD_KEY`). The guard is compiled into the hop's table source, never into its condition,
 * so an unreadable target row behaves exactly like an absent one under any boolean shape.
 */
type RelationHop = { where: Input.OptionalWhere; guard: Input.OptionalWhere; path: Path }

export class WhereBuilder {
	constructor(
		private readonly schema: Model.Schema,
		private readonly joinBuilder: JoinBuilder,
		private readonly conditionBuilder: ConditionBuilder,
		private readonly pathFactory: PathFactory,
		private readonly whereOptimizer: WhereOptimizer,
		private readonly useExistsInHasManyFilter: boolean,
	) {}

	public build<R extends SelectBuilder.Result>(
		qb: SelectBuilder<R>,
		entity: Model.Entity,
		path: Path,
		where: Input.OptionalWhere,
		optimizationHints: WhereOptimizationHints = {},
	): SelectBuilder<R> {
		const optimizedWhere = this.whereOptimizer.optimize(where, entity, optimizationHints)
		return this.buildInternal({
			entity,
			path,
			where: optimizedWhere,
			callback: cb => qb.where(clause => cb(clause)),
			allowManyJoin: false,
		})
	}

	public buildAdvanced<R extends SelectBuilder.Result>(
		entity: Model.Entity,
		path: Path,
		where: Input.OptionalWhere,
		callback: (clauseCb: (clause: SqlConditionBuilder) => SqlConditionBuilder) => SelectBuilder<R>,
		optimizationHints: WhereOptimizationHints = {},
	): SelectBuilder<R> {
		const optimizedWhere = this.whereOptimizer.optimize(where, entity, optimizationHints)
		return this.buildInternal({
			entity,
			path,
			where: optimizedWhere,
			callback,
			allowManyJoin: false,
		})
	}

	/**
	 * Compiles a where into a single boolean SQL condition (a `Literal`), applying any relation joins it needs
	 * to `qb`. Shared by the read-predicate consumers that need the condition as an expression rather than a
	 * WHERE clause: the projection predicate column (selected as a boolean) and the order-by guard (wrapped in
	 * `CASE WHEN <condition> THEN <column> END`). An empty/trivially-true predicate compiles to `true`.
	 */
	public buildConditionLiteral<R extends SelectBuilder.Result>(
		qb: SelectBuilder<R>,
		entity: Model.Entity,
		path: Path,
		where: Input.OptionalWhere,
		optimizationHints: WhereOptimizationHints = {},
	): { qb: SelectBuilder<R>; condition: Literal } {
		let condition: Literal = new Literal('true')
		const resultQb = this.buildAdvanced<R>(
			entity,
			path,
			where,
			applyCondition => {
				condition = SqlConditionBuilder.process(clause => {
					const applied = applyCondition(clause)
					return applied.isEmpty() ? applied.raw('true') : applied
				}).getSql() ?? new Literal('true')
				return qb
			},
			optimizationHints,
		)
		return { qb: resultQb, condition }
	}

	/**
	 * The table source of a relation hop restricted to rows satisfying `guard` (the target's row-level read
	 * predicate): `(select <alias>.* from <table> as <alias> where <guard>)`. LEFT JOINing this source
	 * null-extends an unreadable row exactly like an absent one. The guard is compiled as-definer — its own
	 * relation hops are plain joins — and Postgres pulls the subquery up into the outer join tree.
	 */
	public buildGuardedSource(entity: Model.Entity, path: Path, guard: Input.OptionalWhere): Literal {
		const qb = SelectBuilder.create()
			.select(expr => expr.raw(`${wrapIdentifier(path.alias)}.*`))
			.from(entity.tableName, path.alias)
		const guarded = this.buildInternal({
			entity,
			path,
			where: this.whereOptimizer.optimize(guard, entity),
			callback: cb => qb.where(clause => cb(clause)),
			allowManyJoin: false,
		})
		const query = guarded.createQuery(new Compiler.Context(Compiler.SCHEMA_PLACEHOLDER, new Set()))
		return new Literal(`(${query.sql})`, query.parameters)
	}

	private buildInternal<R extends SelectBuilder.Result>({
		callback,
		...args
	}: {
		entity: Model.Entity
		path: Path
		where: Input.OptionalWhere
		callback: (clauseCb: (clause: SqlConditionBuilder) => SqlConditionBuilder) => SelectBuilder<R>
		allowManyJoin: boolean
	}): SelectBuilder<R> {
		const joinList: WhereJoinDefinition[] = []

		const qbWithWhere = callback(clause =>
			this.buildRecursive({
				conditionBuilder: clause,
				joinList: joinList,
				...args,
			})
		)
		return joinList.reduce<SelectBuilder<R>>(
			(qb, { path, entity, relationName, targetSource }) => this.joinBuilder.join<R>(qb, path, entity, relationName, targetSource),
			qbWithWhere,
		)
	}

	private buildRecursive({
		conditionBuilder,
		entity,
		path,
		where,
		joinList,
		allowManyJoin,
	}: {
		conditionBuilder: SqlConditionBuilder
		entity: Model.Entity
		path: Path
		where: Input.OptionalWhere
		joinList: WhereJoinDefinition[]
		allowManyJoin: boolean
	}): SqlConditionBuilder {
		const tableName = path.alias

		if (where.and !== undefined && where.and !== null && where.and.length > 0) {
			const expr = where.and
			conditionBuilder = conditionBuilder.and(clause =>
				expr.reduce(
					(clause2, where) =>
						!where ? clause2 : this.buildRecursive({
							conditionBuilder: clause2,
							entity,
							path,
							where,
							joinList,
							allowManyJoin,
						}),
					clause,
				)
			)
		}
		if (where.or !== undefined && where.or !== null && where.or.length > 0) {
			const expr = where.or
			conditionBuilder = conditionBuilder.or(clause =>
				expr.reduce(
					(clause2, where) =>
						!where
							? clause2
							: clause2.and(clause3 =>
								this.buildRecursive({
									conditionBuilder: clause3,
									entity,
									path,
									where,
									joinList,
									allowManyJoin,
								})
							),
					clause,
				)
			)
		}
		if (where.not !== undefined && where.not !== null) {
			const expr = where.not
			conditionBuilder = conditionBuilder.not(clause =>
				this.buildRecursive({
					conditionBuilder: clause,
					entity,
					path,
					where: expr,
					joinList,
					allowManyJoin,
				})
			)
		}

		for (const fieldName in where) {
			if (fieldName === 'and' || fieldName === 'or' || fieldName === 'not') {
				continue
			}
			const fieldWhere = where[fieldName]
			if (!fieldWhere) {
				continue
			}

			const targetPath = path.for(fieldName)
			const hop = (): RelationHop => {
				if (!this.isOptionalWhere(fieldWhere)) {
					throw new Error(`WhereBuilder: ${entity.name}::${fieldName} expects a relation where`)
				}
				const { guard, where: relationWhere } = splitReadGuard(fieldWhere)
				const guarded = Object.keys(guard).length > 0
				return { guard, where: relationWhere, path: guarded ? path.for(hopPathSegment(fieldName, true)) : targetPath }
			}

			const joinedWhere = (context: Model.AnyRelationContext): SqlConditionBuilder => {
				const { targetEntity, relation, entity } = context
				const { guard, where: relationWhere, path: targetPath } = hop()
				if (Object.keys(relationWhere).length === 0) {
					return conditionBuilder
				}
				// The FK shortcut skips the join, so it is only valid while every target row is readable.
				if (isIt<Model.JoiningColumnRelation>(relation, 'joiningColumn') && Object.keys(guard).length === 0) {
					const primaryCondition = this.transformWhereToPrimaryCondition(relationWhere, targetEntity.primary)
					if (primaryCondition !== null) {
						return this.conditionBuilder.build(
							conditionBuilder,
							tableName,
							relation.joiningColumn.columnName,
							targetEntity.fields[targetEntity.primary] as Model.AnyColumn,
							primaryCondition,
						)
					}
				}

				joinList.push({
					path: targetPath,
					entity,
					relationName: relation.name,
					targetSource: this.createGuardedSource(targetEntity, targetPath, guard),
				})

				return this.buildRecursive({
					conditionBuilder,
					entity: targetEntity,
					path: targetPath,
					where: relationWhere,
					joinList,
					allowManyJoin,
				})
			}

			conditionBuilder = acceptFieldVisitor<SqlConditionBuilder>(this.schema, entity, fieldName, {
				visitColumn: ({ entity, column }) => {
					return this.conditionBuilder.build(conditionBuilder, tableName, column.columnName, column, fieldWhere as Input.Condition<Input.ColumnValue>)
				},
				visitOneHasOneInverse: joinedWhere,
				visitOneHasOneOwning: joinedWhere,
				visitManyHasOne: joinedWhere,
				visitManyHasManyInverse: context => {
					if (allowManyJoin && !this.useExistsInHasManyFilter) {
						return joinedWhere(context)
					}
					const { guard, where: relationWhere, path: targetPath } = hop()

					return conditionBuilder.exists(
						this.createManyHasManySubquery(
							[tableName, entity.primaryColumn],
							relationWhere,
							guard,
							context.targetEntity,
							context.targetRelation.joiningTable,
							'inverse',
							targetPath,
						),
					)
				},
				visitManyHasManyOwning: context => {
					if (allowManyJoin && !this.useExistsInHasManyFilter) {
						return joinedWhere(context)
					}
					const { guard, where: relationWhere, path: targetPath } = hop()

					return conditionBuilder.exists(
						this.createManyHasManySubquery(
							[tableName, entity.primaryColumn],
							relationWhere,
							guard,
							context.targetEntity,
							context.relation.joiningTable,
							'owning',
							targetPath,
						),
					)
				},
				visitOneHasMany: context => {
					if (allowManyJoin && !this.useExistsInHasManyFilter) {
						return joinedWhere(context)
					}
					const { guard, where: relationWhere, path: targetPath } = hop()

					if (this.hasRootIsNull(relationWhere, context.targetEntity)) {
						// The null-extended row of the LEFT JOIN makes a parent without (readable) children match a
						// column `isNull`; the guarded source keeps unreadable children out of the join.
						const qb = SelectBuilder.create()
							.select(it => it.raw('1'))
							.from(new Literal(`(select ${wrapIdentifier(tableName)}.${wrapIdentifier(entity.primaryColumn)})`), targetPath.for('tmp_').alias)
							.leftJoin(
								this.createGuardedSource(context.targetEntity, targetPath, guard) ?? context.targetEntity.tableName,
								targetPath.alias,
								it => it.columnsEq([targetPath.for('tmp_').alias, entity.primaryColumn], [targetPath.alias, context.targetRelation.joiningColumn.columnName]),
							)
						return conditionBuilder.exists(
							this.buildInternal({
								entity: context.targetEntity,
								path: targetPath,
								where: relationWhere,
								callback: cb => qb.where(clause => cb(clause)),
								allowManyJoin: true,
							}),
						)
					}
					const qb = SelectBuilder.create()
						.select(it => it.raw('1'))
						.from(context.targetEntity.tableName, targetPath.alias)
						.where(it => it.columnsEq([tableName, entity.primaryColumn], [targetPath.alias, context.targetRelation.joiningColumn.columnName]))

					return conditionBuilder.exists(
						this.buildInternal({
							entity: context.targetEntity,
							path: targetPath,
							where: this.combineWhereAnd([relationWhere, guard]),
							callback: cb => qb.where(clause => cb(clause)),
							allowManyJoin: true,
						}),
					)
				},
			})
		}
		return conditionBuilder
	}

	private createGuardedSource(entity: Model.Entity, path: Path, guard: Input.OptionalWhere): Literal | undefined {
		return Object.keys(guard).length === 0 ? undefined : this.buildGuardedSource(entity, path, guard)
	}

	private createManyHasManySubquery(
		outerColumn: QueryBuilder.ColumnIdentifier,
		relationWhere: Input.OptionalWhere,
		guard: Input.OptionalWhere,
		targetEntity: Model.Entity,
		joiningTable: Model.JoiningTable,
		fromSide: 'owning' | 'inverse',
		path: Path,
	) {
		const fromColumn = fromSide === 'owning' ? joiningTable.joiningColumn.columnName : joiningTable.inverseJoiningColumn.columnName
		const toColumn = fromSide === 'owning' ? joiningTable.inverseJoiningColumn.columnName : joiningTable.joiningColumn.columnName
		const junctionPath = path.for('junction_')
		const qb = SelectBuilder.create<SelectBuilder.Result>()
			.from(joiningTable.tableName, junctionPath.alias)
			.select(it => it.raw('1'))
			.where(it => it.columnsEq(outerColumn, [junctionPath.alias, fromColumn]))

		// The junction-only shortcut skips the target table, so it is only valid while every target row is readable.
		const primaryCondition = Object.keys(guard).length === 0 ? this.transformWhereToPrimaryCondition(relationWhere, targetEntity.primary) : null
		if (primaryCondition !== null) {
			const columnType = targetEntity.fields[targetEntity.primary] as Model.AnyColumn

			return qb.where(condition => this.conditionBuilder.build(condition, junctionPath.alias, toColumn, columnType, primaryCondition))
		}

		const qbJoined = qb.join(
			targetEntity.tableName,
			path.alias,
			clause => clause.compareColumns([junctionPath.alias, toColumn], Operator.eq, [path.alias, targetEntity.primary]),
		)
		return this.buildInternal({
			entity: targetEntity,
			path: this.pathFactory.create([], path.fullAlias),
			where: this.combineWhereAnd([relationWhere, guard]),
			callback: cb => qbJoined.where(clause => cb(clause)),
			allowManyJoin: true,
		})
	}

	private combineWhereAnd(wheres: readonly Input.OptionalWhere[]): Input.OptionalWhere {
		const nonEmpty = wheres.filter(it => Object.keys(it).length > 0)
		if (nonEmpty.length === 0) {
			return {}
		}
		return nonEmpty.length === 1 ? nonEmpty[0] : { and: nonEmpty }
	}

	private isInputCondition(value: unknown): value is Input.Condition {
		return value !== null && typeof value === 'object' && !Array.isArray(value)
	}

	private isOptionalWhere(value: unknown): value is Input.OptionalWhere {
		return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)
	}

	private transformWhereToPrimaryCondition(where: Input.OptionalWhere, primaryField: string): Input.Condition<never> | null {
		const keys = Object.keys(where)
		if (keys.filter(it => !['and', 'or', 'not', primaryField].includes(it)).length > 0) {
			return null
		}
		let condition: {
			and?: Array<Input.Condition<never>>
			or?: Array<Input.Condition<never>>
			not?: Input.Condition<never>
		} = {}
		if (where.and) {
			const conditions = where.and
				.filter((it): it is Input.Where => !!it)
				.map(it => this.transformWhereToPrimaryCondition(it, primaryField))
			if (conditions.includes(null)) {
				return null
			}
			condition.and = conditions as Input.Condition<never>[]
		}
		if (where.or) {
			const conditions = where.or
				.filter((it): it is Input.Where => !!it)
				.map(it => this.transformWhereToPrimaryCondition(it, primaryField))
			if (conditions.includes(null)) {
				return null
			}
			condition.or = conditions as Input.Condition<never>[]
		}
		if (where.not) {
			const conditions = this.transformWhereToPrimaryCondition(where.not, primaryField)
			if (conditions === null) {
				return null
			}
			condition.not = conditions as Input.Condition<never>
		}
		if (where[primaryField]) {
			if (Object.keys(condition).length > 0) {
				return { and: [condition, where[primaryField] as Input.Condition<never>] }
			}
			return where[primaryField] as Input.Condition<never>
		}
		return condition
	}

	private hasRootIsNull(where: Input.OptionalWhere, entity: Model.Entity): boolean {
		for (const key in where) {
			if (key === 'and' || key === 'or') {
				if (where[key]?.some(it => it && this.hasRootIsNull(it, entity))) {
					return true
				}
			} else if (key === 'not') {
				if (where.not && this.hasRootIsNull(where.not, entity)) {
					return true
				}
			} else if (isColumn(entity.fields[key])) {
				const condition = where[key]
				if (this.isInputCondition(condition) && this.conditionHasIsNull(condition)) {
					return true
				}
			}
		}
		return false
	}

	private conditionHasIsNull(cond: Input.Condition): boolean {
		return cond.isNull !== undefined
			|| cond.and?.some(item => this.conditionHasIsNull(item)) === true
			|| cond.or?.some(item => this.conditionHasIsNull(item)) === true
			|| (cond.not !== undefined && this.conditionHasIsNull(cond.not))
	}
}

export type WhereJoinDefinition = { path: Path; entity: Model.Entity; relationName: string; targetSource?: Literal }
