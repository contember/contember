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
import { MASKED_CELL_KEY, MaskedCell, parseMaskedCells, splitReadGuard } from '../../acl/PredicatesInjector.js'

/**
 * A user-authored relation hop: the remaining condition on the target rows and the target's row-level read
 * guard (see `READ_GUARD_KEY`). The guard is compiled into the hop's table source, never into its condition,
 * so an unreadable target row behaves exactly like an absent one under any boolean shape.
 */
type RelationHop = { where: Input.OptionalWhere; guard: Input.OptionalWhere; fieldGuard: Input.OptionalWhere; path: Path }

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

		// Every (sub)query starts unnegated: an EXISTS yields TRUE or FALSE, so a `not` around it does not reach in.
		const qbWithWhere = callback(clause =>
			this.buildRecursive({
				conditionBuilder: clause,
				joinList: joinList,
				...args,
				negated: false,
			})
		)
		return joinList.reduce<SelectBuilder<R>>(
			(qb, { path, entity, relationName, targetSource, joinCondition }) =>
				this.joinBuilder.join<R>(qb, path, entity, relationName, targetSource, joinCondition),
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
		negated,
	}: {
		conditionBuilder: SqlConditionBuilder
		entity: Model.Entity
		path: Path
		where: Input.OptionalWhere
		joinList: WhereJoinDefinition[]
		allowManyJoin: boolean
		/** Odd number of enclosing `not`s within the current (sub)query. */
		negated: boolean
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
							negated,
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
									negated,
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
					negated: !negated,
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
			if (fieldName === MASKED_CELL_KEY) {
				conditionBuilder = parseMaskedCells(fieldWhere).reduce(
					(builder, cell) => this.buildMaskedCell(builder, entity, path, cell, joinList, allowManyJoin, negated),
					conditionBuilder,
				)
				continue
			}

			const targetPath = path.for(fieldName)
			const hop = (): RelationHop => {
				if (!this.isOptionalWhere(fieldWhere)) {
					throw new Error(`WhereBuilder: ${entity.name}::${fieldName} expects a relation where`)
				}
				const { guard, fieldGuard, where: relationWhere } = splitReadGuard(fieldWhere)
				const guarded = Object.keys(guard).length > 0 || Object.keys(fieldGuard).length > 0
				return { guard, fieldGuard, where: relationWhere, path: guarded ? path.for(hopPathSegment(fieldName, true)) : targetPath }
			}
			// A masked relation field reads empty: the hop sees no related row where its field guard does not hold.
			const fieldGuardCondition = (fieldGuard: Input.OptionalWhere): Literal | undefined => {
				if (Object.keys(fieldGuard).length === 0) {
					return undefined
				}
				const condition = SqlConditionBuilder.process(clause =>
					this.buildRecursive({ conditionBuilder: clause, entity, path, where: fieldGuard, joinList, allowManyJoin, negated: false })
				).getSql()
				return condition === null ? undefined : new Literal(`coalesce(${condition.sql}, false)`, condition.parameters)
			}
			const existsIfReadable = (fieldGuard: Input.OptionalWhere, subquery: SelectBuilder<SelectBuilder.Result>): SqlConditionBuilder => {
				const readable = fieldGuardCondition(fieldGuard)
				return readable === undefined ? conditionBuilder.exists(subquery) : conditionBuilder.and(clause => clause.with(readable).exists(subquery))
			}

			const joinedWhere = (context: Model.AnyRelationContext): SqlConditionBuilder => {
				const { targetEntity, relation, entity } = context
				const { guard, fieldGuard, where: relationWhere, path: targetPath } = hop()
				if (Object.keys(relationWhere).length === 0) {
					return conditionBuilder
				}
				// The FK shortcut skips the join, so it is only valid while every target row is readable.
				if (isIt<Model.JoiningColumnRelation>(relation, 'joiningColumn') && Object.keys(guard).length === 0 && Object.keys(fieldGuard).length === 0) {
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
					joinCondition: fieldGuardCondition(fieldGuard),
				})

				return this.buildRecursive({
					conditionBuilder,
					entity: targetEntity,
					path: targetPath,
					where: relationWhere,
					joinList,
					allowManyJoin,
					negated,
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
					const { guard, fieldGuard, where: relationWhere, path: targetPath } = hop()

					return existsIfReadable(
						fieldGuard,
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
					const { guard, fieldGuard, where: relationWhere, path: targetPath } = hop()

					return existsIfReadable(
						fieldGuard,
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
					const { guard, fieldGuard, where: relationWhere, path: targetPath } = hop()

					if (this.hasRootIsNull(relationWhere, context.targetEntity)) {
						// The null-extended row of the LEFT JOIN makes a parent without (readable) children match a
						// column `isNull`; the guarded source keeps unreadable children out of the join.
						const subquery = (joinsChildren: boolean) => {
							const qb = SelectBuilder.create()
								.select(it => it.raw('1'))
								.from(new Literal(`(select ${wrapIdentifier(tableName)}.${wrapIdentifier(entity.primaryColumn)})`), targetPath.for('tmp_').alias)
								.leftJoin(
									this.createGuardedSource(context.targetEntity, targetPath, guard) ?? context.targetEntity.tableName,
									targetPath.alias,
									it =>
										joinsChildren
											? it.columnsEq([targetPath.for('tmp_').alias, entity.primaryColumn], [targetPath.alias, context.targetRelation.joiningColumn.columnName])
											: it.raw('false'),
								)
							return this.buildInternal({
								entity: context.targetEntity,
								path: targetPath,
								where: relationWhere,
								callback: cb => qb.where(clause => cb(clause)),
								allowManyJoin: true,
							})
						}
						const readable = fieldGuardCondition(fieldGuard)
						if (readable === undefined) {
							return conditionBuilder.exists(subquery(true))
						}
						// A masked relation is evaluated on the null-extended row alone, like a parent without children.
						const withChildren = subquery(true).createQuery(new Compiler.Context(Compiler.SCHEMA_PLACEHOLDER, new Set()))
						const withoutChildren = subquery(false).createQuery(new Compiler.Context(Compiler.SCHEMA_PLACEHOLDER, new Set()))
						return conditionBuilder.with(
							new Literal(`case when ${readable.sql} then exists (${withChildren.sql}) else exists (${withoutChildren.sql}) end`, [
								...readable.parameters,
								...withChildren.parameters,
								...withoutChildren.parameters,
							]),
						)
					}
					const qb = SelectBuilder.create()
						.select(it => it.raw('1'))
						.from(context.targetEntity.tableName, targetPath.alias)
						.where(it => it.columnsEq([tableName, entity.primaryColumn], [targetPath.alias, context.targetRelation.joiningColumn.columnName]))

					return existsIfReadable(
						fieldGuard,
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

	/**
	 * A condition over a cell-level column holds on a masked cell iff it holds on NULL. Outside a negation FALSE and
	 * NULL drop the row alike, so only a condition that is TRUE on NULL needs more than `cond AND guard`; under a
	 * negation the masked cell must also keep NULL as NULL.
	 */
	private buildMaskedCell(
		conditionBuilder: SqlConditionBuilder,
		entity: Model.Entity,
		path: Path,
		{ guard, where }: MaskedCell,
		joinList: WhereJoinDefinition[],
		allowManyJoin: boolean,
		negated: boolean,
	): SqlConditionBuilder {
		const compile = (where: Input.OptionalWhere) =>
			SqlConditionBuilder.process(clause => this.buildRecursive({ conditionBuilder: clause, entity, path, where, joinList, allowManyJoin, negated }))
				.getSql()
		const condition = compile(where)
		if (condition === null) {
			return conditionBuilder
		}
		const guardCondition = compile(guard)
		if (guardCondition === null) {
			return conditionBuilder.with(condition)
		}
		const onNull = this.evaluateWhereOnNull(where, entity)
		const crispGuard = `coalesce(${guardCondition.sql}, false)`
		if (onNull === 'true') {
			return conditionBuilder.with(new Literal(`(${condition.sql} or not ${crispGuard})`, [...condition.parameters, ...guardCondition.parameters]))
		}
		if (!negated) {
			return conditionBuilder.with(condition).with(guardCondition)
		}
		if (onNull === 'false') {
			return conditionBuilder.with(new Literal(`${condition.sql} and ${crispGuard}`, [...condition.parameters, ...guardCondition.parameters]))
		}
		return conditionBuilder.with(
			new Literal(`case when ${crispGuard} then ${condition.sql} end`, [...guardCondition.parameters, ...condition.parameters]),
		)
	}

	/** The three-valued result of a column where on a NULL cell, mirroring how `ConditionBuilder` compiles it. */
	private evaluateWhereOnNull(where: Input.OptionalWhere, entity: Model.Entity): NullCellValue {
		const operands: NullCellValue[] = []
		for (const [key, value] of Object.entries(where)) {
			if (value === null || value === undefined) {
				continue
			}
			if (!isColumn(entity.fields[key]) || !this.isInputCondition(value)) {
				throw new Error(`WhereBuilder: ${MASKED_CELL_KEY} expects a column condition, got ${entity.name}::${key}`)
			}
			operands.push(this.evaluateConditionOnNull(value))
		}
		return combineNullCellValues(operands, 'and')
	}

	private evaluateConditionOnNull(condition: Input.Condition): NullCellValue {
		const isSet = <T>(value: T | null | undefined): value is T => value !== null && value !== undefined
		if (!Object.values(condition).some(isSet)) {
			return 'empty'
		}
		if (isSet(condition.and)) {
			return combineNullCellValues(condition.and.map(it => this.evaluateConditionOnNull(it)), 'and')
		}
		if (isSet(condition.or)) {
			return combineNullCellValues(condition.or.map(it => this.evaluateConditionOnNull(it)), 'or')
		}
		if (isSet(condition.not)) {
			const operand = this.evaluateConditionOnNull(condition.not)
			return operand === 'true' ? 'false' : operand === 'false' ? 'true' : operand
		}
		const isNull = condition.isNull ?? condition.null
		if (isSet(isNull)) {
			return isNull ? 'true' : 'false'
		}
		if (isSet(condition.always)) {
			return 'true'
		}
		if (isSet(condition.never)) {
			return 'false'
		}
		if (isSet(condition.in)) {
			return condition.in.some(it => it !== undefined) ? 'unknown' : 'false'
		}
		if (isSet(condition.notIn)) {
			return condition.notIn.some(it => it !== undefined) ? 'unknown' : 'true'
		}
		return 'unknown'
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
			} else if (key === MASKED_CELL_KEY) {
				if (parseMaskedCells(where[key]).some(cell => this.hasRootIsNull(cell.where, entity) || this.hasRootIsNull(cell.guard, entity))) {
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

/** `empty` is a condition that compiles to nothing, so it neither holds nor fails. */
type NullCellValue = 'true' | 'false' | 'unknown' | 'empty'

const combineNullCellValues = (operands: readonly NullCellValue[], operator: 'and' | 'or'): NullCellValue => {
	const present = operands.filter(it => it !== 'empty')
	if (present.length === 0) {
		return 'empty'
	}
	const dominant = operator === 'and' ? 'false' : 'true'
	if (present.includes(dominant)) {
		return dominant
	}
	return present.includes('unknown') ? 'unknown' : operator === 'and' ? 'true' : 'false'
}

export type WhereJoinDefinition = { path: Path; entity: Model.Entity; relationName: string; targetSource?: Literal; joinCondition?: Literal }
