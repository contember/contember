import { isIt } from '../../utils/index.js'
import { acceptFieldVisitor, isColumn } from '@contember/schema-utils'
import { Input, Model, Writable } from '@contember/schema'
import { Path, PathFactory } from './Path.js'
import { JoinBuilder } from './JoinBuilder.js'
import { ConditionBuilder } from './ConditionBuilder.js'
import { ConditionBuilder as SqlConditionBuilder, Literal, Operator, QueryBuilder, SelectBuilder, wrapIdentifier } from '@contember/database'
import { WhereOptimizationHints, WhereOptimizer } from './optimizer/WhereOptimizer.js'

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
			(qb, { path, entity, relationName }) => this.joinBuilder.join<R>(qb, path, entity, relationName),
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

			const joinedWhere = (context: Model.AnyRelationContext): SqlConditionBuilder => {
				const { targetEntity, relation, entity } = context
				const relationWhere = where[fieldName] as Input.OptionalWhere | null
				if (!relationWhere || Object.keys(relationWhere).length === 0) {
					return conditionBuilder
				}
				// `{ rel: { <primary>: { isNull: true } } }` on a relation with an injected read predicate means "no
				// READABLE related row" — lower it to `NOT EXISTS(<readable row>)` (null-safe, no existence leak). When
				// the remainder is empty (public relation) the FK fast-path below handles it as `<fk> IS NULL`.
				const absenceRemainder = this.extractAbsenceRemainder(relationWhere, targetEntity.primary)
				if (absenceRemainder !== null && Object.keys(absenceRemainder).length > 0) {
					return conditionBuilder.not(clause => clause.exists(this.buildRelationAbsenceSubquery(context, absenceRemainder, tableName, entity, targetPath)))
				}
				if (isIt<Model.JoiningColumnRelation>(relation, 'joiningColumn')) {
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

				joinList.push({ path: targetPath, entity, relationName: relation.name })

				return this.buildRecursive({
					conditionBuilder,
					entity: targetEntity,
					path: targetPath,
					where: relationWhere,
					joinList,
					allowManyJoin,
				})
			}

			// "no related row" on a has-many / many-has-many: always `NOT EXISTS(<readable row>)`, regardless of join
			// mode — the per-joined-row LEFT JOIN form would mis-evaluate `not` for a parent with mixed readable /
			// unreadable rows.
			const buildManyAbsence = (context: Model.AnyRelationContext): SqlConditionBuilder | null => {
				const remainder = this.extractAbsenceRemainder(fieldWhere as Input.OptionalWhere, context.targetEntity.primary)
				if (remainder === null) {
					return null
				}
				return conditionBuilder.not(clause => clause.exists(this.buildRelationAbsenceSubquery(context, remainder, tableName, entity, targetPath)))
			}

			conditionBuilder = acceptFieldVisitor<SqlConditionBuilder>(this.schema, entity, fieldName, {
				visitColumn: ({ entity, column }) => {
					return this.conditionBuilder.build(conditionBuilder, tableName, column.columnName, column, fieldWhere as Input.Condition<Input.ColumnValue>)
				},
				visitOneHasOneInverse: joinedWhere,
				visitOneHasOneOwning: joinedWhere,
				visitManyHasOne: joinedWhere,
				visitManyHasManyInverse: context => {
					const absence = buildManyAbsence(context)
					if (absence !== null) {
						return absence
					}
					if (allowManyJoin && !this.useExistsInHasManyFilter) {
						return joinedWhere(context)
					}

					return conditionBuilder.exists(
						this.createManyHasManySubquery(
							[tableName, entity.primaryColumn],
							fieldWhere as Input.OptionalWhere,
							context.targetEntity,
							context.targetRelation.joiningTable,
							'inverse',
							targetPath,
						),
					)
				},
				visitManyHasManyOwning: context => {
					const absence = buildManyAbsence(context)
					if (absence !== null) {
						return absence
					}
					if (allowManyJoin && !this.useExistsInHasManyFilter) {
						return joinedWhere(context)
					}

					const relationWhere = where[fieldName] as Input.Where | null

					return conditionBuilder.exists(
						this.createManyHasManySubquery(
							[tableName, entity.primaryColumn],
							fieldWhere as Input.OptionalWhere,
							context.targetEntity,
							context.relation.joiningTable,
							'owning',
							targetPath,
						),
					)
				},
				visitOneHasMany: context => {
					const absence = buildManyAbsence(context)
					if (absence !== null) {
						return absence
					}
					if (allowManyJoin && !this.useExistsInHasManyFilter) {
						return joinedWhere(context)
					}

					const relationWhere = fieldWhere as Input.OptionalWhere

					const qb = this.hasRootIsNull(relationWhere, context.targetEntity)
						? SelectBuilder.create()
							.select(it => it.raw('1'))
							.from(new Literal(`(select ${wrapIdentifier(tableName)}.${wrapIdentifier(entity.primaryColumn)})`), targetPath.for('tmp_').alias)
							.leftJoin(
								context.targetEntity.tableName,
								targetPath.alias,
								it => it.columnsEq([targetPath.for('tmp_').alias, entity.primaryColumn], [targetPath.alias, context.targetRelation.joiningColumn.columnName]),
							)
						: SelectBuilder.create()
							.select(it => it.raw('1'))
							.from(context.targetEntity.tableName, targetPath.alias)
							.where(it => it.columnsEq([tableName, entity.primaryColumn], [targetPath.alias, context.targetRelation.joiningColumn.columnName]))

					return conditionBuilder.exists(
						this.buildInternal({
							entity: context.targetEntity,
							path: targetPath,
							where: relationWhere,
							callback: cb => qb.where(clause => cb(clause)),
							allowManyJoin: true,
						}),
					)
				},
			})
		}
		return conditionBuilder
	}

	private createManyHasManySubquery(
		outerColumn: QueryBuilder.ColumnIdentifier,
		relationWhere: Input.OptionalWhere,
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

		const primaryCondition = this.transformWhereToPrimaryCondition(relationWhere, targetEntity.primary)
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
			where: relationWhere,
			callback: cb => qbJoined.where(clause => cb(clause)),
			allowManyJoin: true,
		})
	}

	/**
	 * If `relationWhere` (a relation sub-where already carrying the injected read predicate) expresses the
	 * "no related row" idiom on the relation primary, returns the readable REMAINDER — what a PRESENT row must
	 * satisfy (the injected read predicate plus any sibling user conditions). The caller lowers the relation to
	 * `NOT EXISTS(<row matching remainder>)`, which is null-safe and treats a present-but-unreadable row as
	 * absent (no existence leak). Returns null when `relationWhere` is not an absence test, leaving the existing
	 * lowering in place.
	 *
	 * Recognised in a conjunctive context: `{ <primary>: { isNull: true } }`, the deprecated `{ null: true }`
	 * alias, the De Morgan form `{ not: { <primary>: { isNull: false } } }`, single-element `and`/`or` wrappers,
	 * multi-key objects (the primary-isNull conjunct is stripped, siblings kept) and nested `and`. Bails (null)
	 * when a primary-isNull assertion would sit under a multi-branch `or` or a non-De-Morgan `not`, or is mixed
	 * with another operator on the primary in the same condition — those are not pure absence tests.
	 */
	private extractAbsenceRemainder(relationWhere: Input.OptionalWhere, primary: string): Input.OptionalWhere | null {
		const stripped = this.stripPrimaryAbsence(relationWhere, primary)
		if (stripped === null || !stripped.found) {
			return null
		}
		return stripped.rest
	}

	private stripPrimaryAbsence(where: Input.OptionalWhere, primary: string): { found: boolean; rest: Input.OptionalWhere } | null {
		if (this.isDeMorganPrimaryAbsence(where, primary)) {
			return { found: true, rest: {} }
		}
		const rest: Writable<Input.OptionalWhere> = {}
		let found = false
		for (const key of Object.keys(where)) {
			if (key === 'and') {
				const parts: Input.OptionalWhere[] = []
				for (const sub of (where.and ?? []).filter((it): it is Input.Where => !!it)) {
					const r = this.stripPrimaryAbsence(sub, primary)
					if (r === null) {
						return null
					}
					found = found || r.found
					if (Object.keys(r.rest).length > 0) {
						parts.push(r.rest)
					}
				}
				if (parts.length > 0) {
					rest.and = parts
				}
			} else if (key === 'or') {
				const branches = (where.or ?? []).filter((it): it is Input.Where => !!it)
				if (branches.length === 1) {
					const r = this.stripPrimaryAbsence(branches[0], primary)
					if (r === null) {
						return null
					}
					found = found || r.found
					if (Object.keys(r.rest).length > 0) {
						rest.or = [r.rest]
					}
				} else {
					// an absence atom cannot be separated out of a multi-branch OR
					if (branches.some(it => this.mentionsPrimaryAbsence(it, primary))) {
						return null
					}
					rest.or = where.or
				}
			} else if (key === 'not') {
				// the whole-node De Morgan form is handled above; a non-De-Morgan `not` carrying the absence atom
				// cannot be expressed in the remainder
				if (where.not && this.mentionsPrimaryAbsence(where.not, primary)) {
					return null
				}
				rest.not = where.not
			} else if (key === primary) {
				const cond = where[primary]
				if (this.isIsNullTrueCondition(cond)) {
					found = true
				} else if (this.conditionHasIsNull(cond as Input.Condition)) {
					// isNull mixed with other operators on the primary — ambiguous, not a pure absence test
					return null
				} else {
					rest[primary] = cond
				}
			} else {
				rest[key] = where[key]
			}
		}
		return { found, rest }
	}

	private isIsNullTrueCondition(cond: unknown): boolean {
		if (cond === null || typeof cond !== 'object') {
			return false
		}
		const c = cond as Input.Condition
		const keys = Object.keys(c)
		return keys.length === 1 && (c.isNull === true || c.null === true)
	}

	private isDeMorganPrimaryAbsence(where: Input.OptionalWhere, primary: string): boolean {
		const keys = Object.keys(where)
		if (keys.length !== 1 || where.not === undefined || where.not === null) {
			return false
		}
		const inner = where.not
		const innerKeys = Object.keys(inner)
		if (innerKeys.length !== 1 || innerKeys[0] !== primary) {
			return false
		}
		const cond = inner[primary]
		if (cond === null || typeof cond !== 'object') {
			return false
		}
		const c = cond as Input.Condition
		const condKeys = Object.keys(c)
		return condKeys.length === 1 && (c.isNull === false || c.null === false)
	}

	/**
	 * Does a primary-isNull-true / De Morgan absence appear anywhere in `where`? Used to refuse separating it
	 * out of positions where the remainder cannot be expressed (multi-branch OR, non-De-Morgan NOT).
	 */
	private mentionsPrimaryAbsence(where: Input.OptionalWhere, primary: string): boolean {
		if (this.isDeMorganPrimaryAbsence(where, primary)) {
			return true
		}
		for (const key of Object.keys(where)) {
			if (key === 'and' || key === 'or') {
				if ((where[key] ?? []).some(it => !!it && this.mentionsPrimaryAbsence(it, primary))) {
					return true
				}
			} else if (key === 'not') {
				if (where.not && this.mentionsPrimaryAbsence(where.not, primary)) {
					return true
				}
			} else if (key === primary && this.isIsNullTrueCondition(where[primary])) {
				return true
			}
		}
		return false
	}

	/**
	 * Builds the EXISTS subquery selecting a PRESENT row that satisfies `remainder` (the readable predicate),
	 * correlated to the parent. The caller negates it. Handles every relation kind so absence lowers uniformly.
	 */
	private buildRelationAbsenceSubquery(
		context: Model.AnyRelationContext,
		remainder: Input.OptionalWhere,
		parentTableName: string,
		parentEntity: Model.Entity,
		targetPath: Path,
	): SelectBuilder<SelectBuilder.Result> {
		const { relation, targetRelation, targetEntity } = context

		// many-has-many: a readable row reachable through the junction
		if (isIt<Model.JoiningTableRelation>(relation, 'joiningTable')) {
			return this.buildManyHasManyAbsenceSubquery(
				[parentTableName, parentEntity.primaryColumn],
				remainder,
				targetEntity,
				relation.joiningTable,
				'owning',
				targetPath,
			)
		}
		if (targetRelation !== null && isIt<Model.JoiningTableRelation>(targetRelation, 'joiningTable')) {
			return this.buildManyHasManyAbsenceSubquery(
				[parentTableName, parentEntity.primaryColumn],
				remainder,
				targetEntity,
				targetRelation.joiningTable,
				'inverse',
				targetPath,
			)
		}

		const qb = SelectBuilder.create<SelectBuilder.Result>()
			.select(it => it.raw('1'))
			.from(targetEntity.tableName, targetPath.alias)

		let correlated: SelectBuilder<SelectBuilder.Result>
		if (isIt<Model.JoiningColumnRelation>(relation, 'joiningColumn')) {
			// owning to-one: the FK lives on the parent and points at the target primary
			correlated = qb.where(it => it.columnsEq([parentTableName, relation.joiningColumn.columnName], [targetPath.alias, targetEntity.primaryColumn]))
		} else if (targetRelation !== null && isIt<Model.JoiningColumnRelation>(targetRelation, 'joiningColumn')) {
			// inverse to-one / has-many: the FK lives on the target and points at the parent primary
			correlated = qb.where(it =>
				it.columnsEq([parentTableName, parentEntity.primaryColumn], [targetPath.alias, targetRelation.joiningColumn.columnName])
			)
		} else {
			correlated = qb
		}

		if (Object.keys(remainder).length === 0) {
			return correlated
		}
		return this.buildInternal({
			entity: targetEntity,
			path: targetPath,
			where: remainder,
			callback: cb => correlated.where(clause => cb(clause)),
			allowManyJoin: true,
		})
	}

	private buildManyHasManyAbsenceSubquery(
		outerColumn: QueryBuilder.ColumnIdentifier,
		remainder: Input.OptionalWhere,
		targetEntity: Model.Entity,
		joiningTable: Model.JoiningTable,
		fromSide: 'owning' | 'inverse',
		path: Path,
	): SelectBuilder<SelectBuilder.Result> {
		if (Object.keys(remainder).length === 0) {
			const fromColumn = fromSide === 'owning' ? joiningTable.joiningColumn.columnName : joiningTable.inverseJoiningColumn.columnName
			const junctionPath = path.for('junction_')
			return SelectBuilder.create<SelectBuilder.Result>()
				.from(joiningTable.tableName, junctionPath.alias)
				.select(it => it.raw('1'))
				.where(it => it.columnsEq(outerColumn, [junctionPath.alias, fromColumn]))
		}
		return this.createManyHasManySubquery(outerColumn, remainder, targetEntity, joiningTable, fromSide, path)
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
			} else if (isColumn(entity.fields[key]) && this.conditionHasIsNull(where[key] as Input.Condition)) {
				return true
			}
		}
		return false
	}

	private conditionHasIsNull(cond: Input.Condition): boolean {
		if (cond.isNull !== undefined) {
			return true
		}
		if (cond.and?.some(it => this.conditionHasIsNull(it))) {
			return true
		}
		if (cond.or?.some(it => this.conditionHasIsNull(it))) {
			return true
		}
		if (cond.not && this.conditionHasIsNull(cond.not)) {
			return true
		}
		return false
	}
}

export type WhereJoinDefinition = { path: Path; entity: Model.Entity; relationName: string }
