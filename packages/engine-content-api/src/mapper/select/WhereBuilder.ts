import { isIt } from '../../utils/index.js'
import { acceptFieldVisitor, isColumn } from '@contember/schema-utils'
import { Input, Model, Writable } from '@contember/schema'
import { Path, PathFactory } from './Path.js'
import { JoinBuilder } from './JoinBuilder.js'
import { ConditionBuilder } from './ConditionBuilder.js'
import { ConditionBuilder as SqlConditionBuilder, Literal, Operator, QueryBuilder, SelectBuilder, wrapIdentifier } from '@contember/database'
import { WhereOptimizationHints, WhereOptimizer } from './optimizer/WhereOptimizer.js'
import type { PredicateInjection, RelationPredicateGuard } from '../../acl/PredicateInjection.js'
import { createGuardObligationWhere } from '../../acl/RelationGuardMaterializer.js'
import deepEqual from 'fast-deep-equal'

// Row expressions share one target row; set expressions combine correlated relation queries.
type RelationRowExpression = { kind: 'row'; where: Input.OptionalWhere }
type RelationSetExpression =
	| { kind: 'exists' | 'notExists'; where: Input.OptionalWhere }
	| { kind: 'and' | 'or'; operands: readonly RelationSetExpression[] }
	| { kind: 'not'; operand: RelationSetExpression }
type RelationExpression = RelationRowExpression | RelationSetExpression

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
		where: Input.OptionalWhere | PredicateInjection,
		optimizationHints: WhereOptimizationHints = {},
	): SelectBuilder<R> {
		const prepared = this.preparePredicateInjection(entity, where, optimizationHints)
		return this.buildInternal({
			entity,
			path,
			where: prepared.where,
			guardWhere: prepared.guard,
			relationGuard: prepared.relationGuard,
			traversedRelationPath: [],
			callback: cb => qb.where(clause => cb(clause)),
			allowManyJoin: false,
		})
	}

	public buildAdvanced<R extends SelectBuilder.Result>(
		entity: Model.Entity,
		path: Path,
		where: Input.OptionalWhere | PredicateInjection,
		callback: (clauseCb: (clause: SqlConditionBuilder) => SqlConditionBuilder) => SelectBuilder<R>,
		optimizationHints: WhereOptimizationHints = {},
	): SelectBuilder<R> {
		const prepared = this.preparePredicateInjection(entity, where, optimizationHints)
		return this.buildInternal({
			entity,
			path,
			where: prepared.where,
			guardWhere: prepared.guard,
			relationGuard: prepared.relationGuard,
			traversedRelationPath: [],
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
		where: Input.OptionalWhere | PredicateInjection,
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

	private preparePredicateInjection(
		entity: Model.Entity,
		where: Input.OptionalWhere | PredicateInjection,
		optimizationHints: WhereOptimizationHints,
	): {
		where: Input.OptionalWhere
		guard: Input.OptionalWhere | undefined
		relationGuard: RelationPredicateGuard | undefined
	} {
		const resolved = this.resolvePredicateInjection(where)
		const normalizedWhere = this.normalizeNullableBooleanEntries(resolved.where, entity)
		const optimizedWhere = this.whereOptimizer.optimize(normalizedWhere, entity, optimizationHints)
		const optimizedGuard = resolved.guard === undefined
			? undefined
			: this.whereOptimizer.optimize(resolved.guard, entity, optimizationHints)
		return {
			where: optimizedWhere,
			guard: this.normalizeGuard(optimizedGuard, entity),
			relationGuard: resolved.relationGuard,
		}
	}

	private normalizeNullableBooleanEntries(where: Input.OptionalWhere, entity: Model.Entity): Input.OptionalWhere {
		const normalized: Writable<Input.OptionalWhere> = { ...where }
		if (where.and) {
			normalized.and = where.and
				.filter((item): item is Input.Where => item !== null && item !== undefined)
				.map(item => this.normalizeNullableBooleanEntries(item, entity))
		}
		if (where.or) {
			normalized.or = where.or
				.filter((item): item is Input.Where => item !== null && item !== undefined)
				.map(item => this.normalizeNullableBooleanEntries(item, entity))
		}
		if (where.not) {
			normalized.not = this.normalizeNullableBooleanEntries(where.not, entity)
		}
		for (const fieldName of Object.keys(where)) {
			if (fieldName === 'and' || fieldName === 'or' || fieldName === 'not') {
				continue
			}
			normalized[fieldName] = acceptFieldVisitor(this.schema, entity, fieldName, {
				visitColumn: () => where[fieldName],
				visitRelation: context => {
					const relationWhere = where[fieldName]
					return this.isOptionalWhere(relationWhere)
						? this.normalizeNullableBooleanEntries(relationWhere, context.targetEntity)
						: relationWhere
				},
			})
		}
		return normalized
	}

	private normalizeGuard(guard: Input.OptionalWhere | undefined, entity: Model.Entity): Input.OptionalWhere | undefined {
		if (guard === undefined) {
			return undefined
		}
		if (Object.keys(guard).length !== 1) {
			return guard
		}
		const primaryCondition = guard[entity.primary]
		const isCanonicalTrue = primaryCondition !== null
			&& primaryCondition !== undefined
			&& typeof primaryCondition === 'object'
			&& !Array.isArray(primaryCondition)
			&& Object.keys(primaryCondition).length === 1
			&& 'always' in primaryCondition
			&& primaryCondition.always === true
		return isCanonicalTrue ? undefined : guard
	}

	private buildInternal<R extends SelectBuilder.Result>({
		callback,
		...args
	}: {
		entity: Model.Entity
		path: Path
		where: Input.OptionalWhere
		guardWhere?: Input.OptionalWhere
		relationGuard?: RelationPredicateGuard
		traversedRelationPath: readonly Model.AnyRelationContext[]
		callback: (clauseCb: (clause: SqlConditionBuilder) => SqlConditionBuilder) => SelectBuilder<R>
		allowManyJoin: boolean
	}): SelectBuilder<R> {
		const joinList: WhereJoinDefinition[] = []

		const qbWithWhere = callback(clause => {
			let condition = this.buildRecursive({
				conditionBuilder: clause,
				joinList: joinList,
				...args,
			})
			if (args.guardWhere !== undefined && Object.keys(args.guardWhere).length > 0) {
				condition = this.buildRecursive({
					conditionBuilder: condition,
					entity: args.entity,
					path: args.path,
					where: args.guardWhere,
					joinList,
					allowManyJoin: args.allowManyJoin,
					relationGuard: undefined,
					traversedRelationPath: args.traversedRelationPath,
				})
			}
			return condition
		})
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
		relationGuard,
		traversedRelationPath,
	}: {
		conditionBuilder: SqlConditionBuilder
		entity: Model.Entity
		path: Path
		where: Input.OptionalWhere
		joinList: WhereJoinDefinition[]
		allowManyJoin: boolean
		relationGuard?: RelationPredicateGuard
		traversedRelationPath: readonly Model.AnyRelationContext[]
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
							relationGuard,
							traversedRelationPath,
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
									relationGuard,
									traversedRelationPath,
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
					relationGuard,
					traversedRelationPath,
				})
			)
			if (relationGuard !== undefined) {
				// Materialize once so OR branches stay local and generated guard fields are not resolved again.
				const guardObligation = createGuardObligationWhere(
					this.schema,
					entity,
					expr,
					{},
					relationGuard,
					traversedRelationPath,
				)
				if (Object.keys(guardObligation).length > 0) {
					conditionBuilder = this.buildRecursive({
						conditionBuilder,
						entity,
						path,
						where: guardObligation,
						joinList,
						allowManyJoin,
						relationGuard: undefined,
						traversedRelationPath,
					})
				}
			}
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
				const targetGuard = this.normalizeGuard(
					relationGuard?.create(context, relationWhere, traversedRelationPath),
					targetEntity,
				) ?? {}
				const relationSetCondition = this.buildRelationSetCondition(
					conditionBuilder,
					context,
					relationWhere,
					targetGuard,
					tableName,
					entity,
					targetPath,
					relationGuard,
					[...traversedRelationPath, context],
				)
				if (relationSetCondition !== null) {
					return relationSetCondition
				}
				const guardedRelationWhere = this.combineWhereAnd([relationWhere, targetGuard])
				if (isIt<Model.JoiningColumnRelation>(relation, 'joiningColumn')) {
					const primaryCondition = this.transformWhereToPrimaryCondition(guardedRelationWhere, targetEntity.primary)
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

				let result = this.buildRecursive({
					conditionBuilder,
					entity: targetEntity,
					path: targetPath,
					where: relationWhere,
					joinList,
					allowManyJoin,
					relationGuard,
					traversedRelationPath: [...traversedRelationPath, context],
				})
				if (Object.keys(targetGuard).length > 0) {
					result = this.buildRecursive({
						conditionBuilder: result,
						entity: targetEntity,
						path: targetPath,
						where: targetGuard,
						joinList,
						allowManyJoin,
						relationGuard: undefined,
						traversedRelationPath: [...traversedRelationPath, context],
					})
				}
				return result
			}

			const buildSetCondition = (context: Model.AnyRelationContext) => {
				if (!this.isOptionalWhere(fieldWhere)) {
					return null
				}
				const targetGuard = this.normalizeGuard(
					relationGuard?.create(context, fieldWhere, traversedRelationPath),
					context.targetEntity,
				) ?? {}
				return this.buildRelationSetCondition(
					conditionBuilder,
					context,
					fieldWhere,
					targetGuard,
					tableName,
					entity,
					targetPath,
					relationGuard,
					[...traversedRelationPath, context],
				)
			}

			conditionBuilder = acceptFieldVisitor<SqlConditionBuilder>(this.schema, entity, fieldName, {
				visitColumn: ({ entity, column }) => {
					return this.conditionBuilder.build(conditionBuilder, tableName, column.columnName, column, fieldWhere as Input.Condition<Input.ColumnValue>)
				},
				visitOneHasOneInverse: context => joinedWhere(context),
				visitOneHasOneOwning: context => joinedWhere(context),
				visitManyHasOne: context => joinedWhere(context),
				visitManyHasManyInverse: context => {
					const setCondition = buildSetCondition(context)
					if (setCondition !== null) {
						return setCondition
					}
					if (allowManyJoin && !this.useExistsInHasManyFilter) {
						return joinedWhere(context)
					}
					if (!this.isOptionalWhere(fieldWhere)) {
						return conditionBuilder
					}
					const relationWhere = fieldWhere
					const targetGuard = this.normalizeGuard(
						relationGuard?.create(context, relationWhere, traversedRelationPath),
						context.targetEntity,
					) ?? {}

					return conditionBuilder.exists(
						this.createManyHasManySubquery(
							[tableName, entity.primaryColumn],
							relationWhere,
							targetGuard,
							context.targetEntity,
							context.targetRelation.joiningTable,
							'inverse',
							targetPath,
							relationGuard,
							[...traversedRelationPath, context],
						),
					)
				},
				visitManyHasManyOwning: context => {
					const setCondition = buildSetCondition(context)
					if (setCondition !== null) {
						return setCondition
					}
					if (allowManyJoin && !this.useExistsInHasManyFilter) {
						return joinedWhere(context)
					}

					if (!this.isOptionalWhere(fieldWhere)) {
						return conditionBuilder
					}
					const relationWhere = fieldWhere
					const targetGuard = this.normalizeGuard(
						relationGuard?.create(context, relationWhere, traversedRelationPath),
						context.targetEntity,
					) ?? {}

					return conditionBuilder.exists(
						this.createManyHasManySubquery(
							[tableName, entity.primaryColumn],
							relationWhere,
							targetGuard,
							context.targetEntity,
							context.relation.joiningTable,
							'owning',
							targetPath,
							relationGuard,
							[...traversedRelationPath, context],
						),
					)
				},
				visitOneHasMany: context => {
					const setCondition = buildSetCondition(context)
					if (setCondition !== null) {
						return setCondition
					}
					if (allowManyJoin && !this.useExistsInHasManyFilter) {
						return joinedWhere(context)
					}

					const relationWhere = fieldWhere as Input.OptionalWhere
					const targetGuard = this.normalizeGuard(
						relationGuard?.create(context, relationWhere, traversedRelationPath),
						context.targetEntity,
					) ?? {}
					const guardedRelationWhere = this.combineWhereAnd([relationWhere, targetGuard])

					const qb = this.hasRootIsNull(guardedRelationWhere, context.targetEntity)
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
							guardWhere: targetGuard,
							callback: cb => qb.where(clause => cb(clause)),
							allowManyJoin: true,
							relationGuard,
							traversedRelationPath: [...traversedRelationPath, context],
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
		guardWhere: Input.OptionalWhere,
		targetEntity: Model.Entity,
		joiningTable: Model.JoiningTable,
		fromSide: 'owning' | 'inverse',
		path: Path,
		relationGuard?: RelationPredicateGuard,
		traversedRelationPath: readonly Model.AnyRelationContext[] = [],
	) {
		const fromColumn = fromSide === 'owning' ? joiningTable.joiningColumn.columnName : joiningTable.inverseJoiningColumn.columnName
		const toColumn = fromSide === 'owning' ? joiningTable.inverseJoiningColumn.columnName : joiningTable.joiningColumn.columnName
		const junctionPath = path.for('junction_')
		const qb = SelectBuilder.create<SelectBuilder.Result>()
			.from(joiningTable.tableName, junctionPath.alias)
			.select(it => it.raw('1'))
			.where(it => it.columnsEq(outerColumn, [junctionPath.alias, fromColumn]))

		const primaryCondition = this.transformWhereToPrimaryCondition(this.combineWhereAnd([relationWhere, guardWhere]), targetEntity.primary)
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
			guardWhere,
			callback: cb => qbJoined.where(clause => cb(clause)),
			allowManyJoin: true,
			relationGuard,
			traversedRelationPath,
		})
	}

	private buildRelationSetCondition(
		conditionBuilder: SqlConditionBuilder,
		context: Model.AnyRelationContext,
		where: Input.OptionalWhere,
		guard: Input.OptionalWhere,
		parentTableName: string,
		parentEntity: Model.Entity,
		targetPath: Path,
		relationGuard: RelationPredicateGuard | undefined,
		traversedRelationPath: readonly Model.AnyRelationContext[],
	): SqlConditionBuilder | null {
		const expression = this.parseRelationWhere(where, context.targetEntity.primary)
		if (expression.kind === 'row' || (expression.kind === 'exists' && Object.keys(expression.where).length === 0)) {
			return null
		}
		return this.applyRelationSetExpression(
			conditionBuilder,
			expression,
			context,
			guard,
			parentTableName,
			parentEntity,
			targetPath,
			relationGuard,
			traversedRelationPath,
		)
	}

	private parseRelationWhere(where: Input.OptionalWhere, primary: string): RelationExpression {
		const operands: RelationExpression[] = []
		if (where.and) {
			operands.push(...where.and.filter((it): it is Input.Where => !!it).map(it => this.parseRelationWhere(it, primary)))
		}
		if (where.or) {
			const branches = where.or.filter((it): it is Input.Where => !!it).map(it => this.parseRelationWhere(it, primary))
			operands.push(this.combineRelationOr(branches, primary))
		}
		if (where.not) {
			operands.push(this.negateRelationExpression(this.parseRelationWhere(where.not, primary)))
		}
		for (const key of Object.keys(where)) {
			if (key === 'and' || key === 'or' || key === 'not') {
				continue
			}
			const value = where[key]
			if (value === null || value === undefined) {
				continue
			}
			operands.push(
				key === primary && this.isInputCondition(value)
					? this.parsePrimaryCondition(primary, value)
					: { kind: 'row', where: { [key]: value } },
			)
		}
		if (operands.some((it): it is RelationRowExpression => it.kind === 'row') && operands.some(it => it.kind !== 'row')) {
			// A public conjunction such as `{ id: { isNull: true }, name: { eq: 'John' } }`
			// remains one ordinary target-row condition. Only a pure presence expression changes relation-set semantics.
			return { kind: 'row', where }
		}
		return this.combineRelationAnd(operands)
	}

	private parsePrimaryCondition(primary: string, condition: Input.Condition): RelationExpression {
		const presenceExpression = this.parsePurePrimaryPresenceCondition(condition)
		return presenceExpression ?? { kind: 'row', where: { [primary]: condition } }
	}

	private parsePurePrimaryPresenceCondition(condition: Input.Condition): RelationSetExpression | null {
		const operands: RelationSetExpression[] = []
		const directKeys = Object.keys(condition).filter(key => !['and', 'or', 'not', 'isNull', 'null'].includes(key))
		if (directKeys.length > 0) {
			return null
		}
		if (condition.and) {
			const nested: RelationSetExpression[] = []
			for (const item of condition.and) {
				const parsed = this.parsePurePrimaryPresenceCondition(item)
				if (parsed === null) {
					return null
				}
				nested.push(parsed)
			}
			operands.push({ kind: 'and', operands: nested })
		}
		if (condition.or) {
			const nested: RelationSetExpression[] = []
			for (const item of condition.or) {
				const parsed = this.parsePurePrimaryPresenceCondition(item)
				if (parsed === null) {
					return null
				}
				nested.push(parsed)
			}
			operands.push({ kind: 'or', operands: nested })
		}
		if (condition.not) {
			const nested = this.parsePurePrimaryPresenceCondition(condition.not)
			if (nested === null) {
				return null
			}
			const negated = this.negateRelationExpression(nested)
			if (negated.kind === 'row') {
				return null
			}
			operands.push(negated)
		}
		if (condition.isNull === true || condition.null === true) {
			operands.push({ kind: 'notExists', where: {} })
		}
		if (condition.isNull === false || condition.null === false) {
			operands.push({ kind: 'exists', where: {} })
		}
		if (operands.length === 0) {
			return null
		}
		return operands.length === 1 ? operands[0] : { kind: 'and', operands }
	}

	private combineRelationAnd(operands: readonly RelationExpression[]): RelationExpression {
		const rowWheres: Input.OptionalWhere[] = []
		const setOperands: RelationSetExpression[] = []
		for (const operand of operands) {
			if (operand.kind === 'row') {
				if (Object.keys(operand.where).length > 0) {
					rowWheres.push(operand.where)
				}
			} else {
				setOperands.push(operand)
			}
		}
		const rowWhere = this.combineWhereAnd(rowWheres)
		if (setOperands.length === 0) {
			return { kind: 'row', where: rowWhere }
		}
		if (rowWheres.length > 0) {
			return { kind: 'row', where: rowWhere }
		}
		return setOperands.length === 1 ? setOperands[0] : { kind: 'and', operands: setOperands }
	}

	private combineRelationOr(operands: readonly RelationExpression[], primary: string): RelationExpression {
		if (operands.length === 0) {
			return { kind: 'row', where: { [primary]: { never: true } } }
		}
		if (operands.every((it): it is RelationRowExpression => it.kind === 'row')) {
			return { kind: 'row', where: { or: operands.map(it => it.where) } }
		}
		const setOperands = operands.map(it => this.toRelationSetExpression(it))
		return setOperands.length === 1 ? setOperands[0] : { kind: 'or', operands: setOperands }
	}

	private toRelationSetExpression(expression: RelationExpression): RelationSetExpression {
		return expression.kind === 'row' ? { kind: 'exists', where: expression.where } : expression
	}

	private negateRelationExpression(expression: RelationExpression): RelationExpression {
		switch (expression.kind) {
			case 'row':
				return { kind: 'row', where: { not: expression.where } }
			case 'exists':
				return { kind: 'notExists', where: expression.where }
			case 'notExists':
				return { kind: 'exists', where: expression.where }
			case 'not':
				return expression.operand
			case 'and':
			case 'or':
				return { kind: 'not', operand: expression }
		}
	}

	private combineWhereAnd(wheres: readonly Input.OptionalWhere[]): Input.OptionalWhere {
		const nonEmpty: Input.OptionalWhere[] = []
		for (const where of wheres) {
			if (Object.keys(where).length > 0 && !nonEmpty.some(existing => deepEqual(existing, where))) {
				nonEmpty.push(where)
			}
		}
		if (nonEmpty.length === 0) {
			return {}
		}
		return nonEmpty.length === 1 ? nonEmpty[0] : { and: nonEmpty }
	}

	private applyRelationSetExpression(
		conditionBuilder: SqlConditionBuilder,
		expression: RelationSetExpression,
		context: Model.AnyRelationContext,
		guard: Input.OptionalWhere,
		parentTableName: string,
		parentEntity: Model.Entity,
		targetPath: Path,
		relationGuard: RelationPredicateGuard | undefined,
		traversedRelationPath: readonly Model.AnyRelationContext[],
	): SqlConditionBuilder {
		const apply = (builder: SqlConditionBuilder, operand: RelationSetExpression) =>
			this.applyRelationSetExpression(
				builder,
				operand,
				context,
				guard,
				parentTableName,
				parentEntity,
				targetPath,
				relationGuard,
				traversedRelationPath,
			)
		switch (expression.kind) {
			case 'exists':
				return conditionBuilder.exists(
					this.buildRelationSubquery(
						context,
						expression.where,
						guard,
						parentTableName,
						parentEntity,
						targetPath,
						relationGuard,
						traversedRelationPath,
					),
				)
			case 'notExists':
				return conditionBuilder.not(clause =>
					clause.exists(
						this.buildRelationSubquery(
							context,
							expression.where,
							guard,
							parentTableName,
							parentEntity,
							targetPath,
							relationGuard,
							traversedRelationPath,
						),
					)
				)
			case 'and':
				return conditionBuilder.and(clause => expression.operands.reduce((builder, operand) => apply(builder, operand), clause))
			case 'or':
				return conditionBuilder.or(clause => expression.operands.reduce((builder, operand) => builder.and(inner => apply(inner, operand)), clause))
			case 'not':
				return conditionBuilder.not(clause => apply(clause, expression.operand))
		}
	}

	private isInputCondition(value: unknown): value is Input.Condition {
		return value !== null && typeof value === 'object' && !Array.isArray(value)
	}

	private isOptionalWhere(value: unknown): value is Input.OptionalWhere {
		return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)
	}

	private resolvePredicateInjection(where: Input.OptionalWhere | PredicateInjection): {
		where: Input.OptionalWhere
		guard: Input.OptionalWhere | undefined
		relationGuard: RelationPredicateGuard | undefined
	} {
		if (this.isPredicateInjection(where)) {
			return { where: where.where, guard: where.guard, relationGuard: where.relationGuard }
		}
		return { where, guard: undefined, relationGuard: undefined }
	}

	private isPredicateInjection(where: Input.OptionalWhere | PredicateInjection): where is PredicateInjection {
		return (
			'relationGuard' in where
			&& typeof where.relationGuard === 'object'
			&& where.relationGuard !== null
			&& 'create' in where.relationGuard
			&& 'where' in where
		)
	}

	/** Builds a correlated subquery for a matching related row. */
	private buildRelationSubquery(
		context: Model.AnyRelationContext,
		remainder: Input.OptionalWhere,
		guardWhere: Input.OptionalWhere,
		parentTableName: string,
		parentEntity: Model.Entity,
		targetPath: Path,
		relationGuard: RelationPredicateGuard | undefined,
		traversedRelationPath: readonly Model.AnyRelationContext[],
	): SelectBuilder<SelectBuilder.Result> {
		const { relation, targetRelation, targetEntity } = context

		// many-has-many: a readable row reachable through the junction
		if (isIt<Model.JoiningTableRelation>(relation, 'joiningTable')) {
			return this.buildManyHasManySubquery(
				[parentTableName, parentEntity.primaryColumn],
				remainder,
				guardWhere,
				targetEntity,
				relation.joiningTable,
				'owning',
				targetPath,
				relationGuard,
				traversedRelationPath,
			)
		}
		if (targetRelation !== null && isIt<Model.JoiningTableRelation>(targetRelation, 'joiningTable')) {
			return this.buildManyHasManySubquery(
				[parentTableName, parentEntity.primaryColumn],
				remainder,
				guardWhere,
				targetEntity,
				targetRelation.joiningTable,
				'inverse',
				targetPath,
				relationGuard,
				traversedRelationPath,
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

		if (Object.keys(remainder).length === 0 && Object.keys(guardWhere).length === 0) {
			return correlated
		}
		return this.buildInternal({
			entity: targetEntity,
			path: targetPath,
			where: remainder,
			guardWhere,
			callback: cb => correlated.where(clause => cb(clause)),
			allowManyJoin: true,
			relationGuard,
			traversedRelationPath,
		})
	}

	private buildManyHasManySubquery(
		outerColumn: QueryBuilder.ColumnIdentifier,
		remainder: Input.OptionalWhere,
		guardWhere: Input.OptionalWhere,
		targetEntity: Model.Entity,
		joiningTable: Model.JoiningTable,
		fromSide: 'owning' | 'inverse',
		path: Path,
		relationGuard: RelationPredicateGuard | undefined,
		traversedRelationPath: readonly Model.AnyRelationContext[],
	): SelectBuilder<SelectBuilder.Result> {
		if (Object.keys(remainder).length === 0 && Object.keys(guardWhere).length === 0) {
			const fromColumn = fromSide === 'owning' ? joiningTable.joiningColumn.columnName : joiningTable.inverseJoiningColumn.columnName
			const junctionPath = path.for('junction_')
			return SelectBuilder.create<SelectBuilder.Result>()
				.from(joiningTable.tableName, junctionPath.alias)
				.select(it => it.raw('1'))
				.where(it => it.columnsEq(outerColumn, [junctionPath.alias, fromColumn]))
		}
		return this.createManyHasManySubquery(
			outerColumn,
			remainder,
			guardWhere,
			targetEntity,
			joiningTable,
			fromSide,
			path,
			relationGuard,
			traversedRelationPath,
		)
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

export type WhereJoinDefinition = { path: Path; entity: Model.Entity; relationName: string }
