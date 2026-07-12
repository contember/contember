import { isIt } from '../../utils/index.js'
import { acceptFieldVisitor, isColumn } from '@contember/schema-utils'
import { Input, Model } from '@contember/schema'
import { Path, PathFactory } from './Path.js'
import { JoinBuilder } from './JoinBuilder.js'
import { ConditionBuilder } from './ConditionBuilder.js'
import { ConditionBuilder as SqlConditionBuilder, Literal, Operator, QueryBuilder, SelectBuilder, wrapIdentifier } from '@contember/database'
import { WhereOptimizationHints, WhereOptimizer } from './optimizer/WhereOptimizer.js'

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
				const relationSetCondition = this.buildRelationSetCondition(conditionBuilder, context, relationWhere, tableName, entity, targetPath)
				if (relationSetCondition !== null) {
					return relationSetCondition
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

			const buildSetCondition = (context: Model.AnyRelationContext) => {
				if (!this.isOptionalWhere(fieldWhere)) {
					return null
				}
				return this.buildRelationSetCondition(
					conditionBuilder,
					context,
					fieldWhere,
					tableName,
					entity,
					targetPath,
				)
			}

			conditionBuilder = acceptFieldVisitor<SqlConditionBuilder>(this.schema, entity, fieldName, {
				visitColumn: ({ entity, column }) => {
					return this.conditionBuilder.build(conditionBuilder, tableName, column.columnName, column, fieldWhere as Input.Condition<Input.ColumnValue>)
				},
				visitOneHasOneInverse: joinedWhere,
				visitOneHasOneOwning: joinedWhere,
				visitManyHasOne: joinedWhere,
				visitManyHasManyInverse: context => {
					const setCondition = buildSetCondition(context)
					if (setCondition !== null) {
						return setCondition
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
					const setCondition = buildSetCondition(context)
					if (setCondition !== null) {
						return setCondition
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
					const setCondition = buildSetCondition(context)
					if (setCondition !== null) {
						return setCondition
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

	private buildRelationSetCondition(
		conditionBuilder: SqlConditionBuilder,
		context: Model.AnyRelationContext,
		where: Input.OptionalWhere,
		parentTableName: string,
		parentEntity: Model.Entity,
		targetPath: Path,
	): SqlConditionBuilder | null {
		const expression = this.parseRelationWhere(where, context.targetEntity.primary)
		if (expression.kind === 'row' || (expression.kind === 'exists' && Object.keys(expression.where).length === 0)) {
			return null
		}
		return this.applyRelationSetExpression(conditionBuilder, expression, context, parentTableName, parentEntity, targetPath)
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
		return this.combineRelationAnd(operands)
	}

	private parsePrimaryCondition(primary: string, condition: Input.Condition): RelationExpression {
		if (condition.and) {
			return this.combineRelationAnd(condition.and.map(it => this.parsePrimaryCondition(primary, it)))
		}
		if (condition.or) {
			return this.combineRelationOr(condition.or.map(it => this.parsePrimaryCondition(primary, it)), primary)
		}
		if (condition.not) {
			return this.negateRelationExpression(this.parsePrimaryCondition(primary, condition.not))
		}
		if (condition.isNull === true || condition.null === true) {
			return { kind: 'notExists', where: {} }
		}
		if (condition.isNull === false || condition.null === false) {
			return { kind: 'exists', where: {} }
		}
		return { kind: 'row', where: { [primary]: condition } }
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
		const contextualized = setOperands.map(it => this.applyRelationRowContext(it, rowWhere))
		return contextualized.length === 1 ? contextualized[0] : { kind: 'and', operands: contextualized }
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

	private applyRelationRowContext(expression: RelationSetExpression, context: Input.OptionalWhere): RelationSetExpression {
		if (Object.keys(context).length === 0) {
			return expression
		}
		switch (expression.kind) {
			case 'exists':
			case 'notExists':
				return { kind: expression.kind, where: this.combineWhereAnd([expression.where, context]) }
			case 'and':
			case 'or':
				return { kind: expression.kind, operands: expression.operands.map(it => this.applyRelationRowContext(it, context)) }
			case 'not':
				return { kind: 'not', operand: this.applyRelationRowContext(expression.operand, context) }
		}
	}

	private combineWhereAnd(wheres: readonly Input.OptionalWhere[]): Input.OptionalWhere {
		const nonEmpty = wheres.filter(it => Object.keys(it).length > 0)
		if (nonEmpty.length === 0) {
			return {}
		}
		return nonEmpty.length === 1 ? nonEmpty[0] : { and: nonEmpty }
	}

	private applyRelationSetExpression(
		conditionBuilder: SqlConditionBuilder,
		expression: RelationSetExpression,
		context: Model.AnyRelationContext,
		parentTableName: string,
		parentEntity: Model.Entity,
		targetPath: Path,
	): SqlConditionBuilder {
		const apply = (builder: SqlConditionBuilder, operand: RelationSetExpression) =>
			this.applyRelationSetExpression(builder, operand, context, parentTableName, parentEntity, targetPath)
		switch (expression.kind) {
			case 'exists':
				return conditionBuilder.exists(this.buildRelationSubquery(context, expression.where, parentTableName, parentEntity, targetPath))
			case 'notExists':
				return conditionBuilder.not(clause =>
					clause.exists(
						this.buildRelationSubquery(context, expression.where, parentTableName, parentEntity, targetPath),
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

	/** Builds a correlated subquery for a matching related row. */
	private buildRelationSubquery(
		context: Model.AnyRelationContext,
		remainder: Input.OptionalWhere,
		parentTableName: string,
		parentEntity: Model.Entity,
		targetPath: Path,
	): SelectBuilder<SelectBuilder.Result> {
		const { relation, targetRelation, targetEntity } = context

		// many-has-many: a readable row reachable through the junction
		if (isIt<Model.JoiningTableRelation>(relation, 'joiningTable')) {
			return this.buildManyHasManySubquery(
				[parentTableName, parentEntity.primaryColumn],
				remainder,
				targetEntity,
				relation.joiningTable,
				'owning',
				targetPath,
			)
		}
		if (targetRelation !== null && isIt<Model.JoiningTableRelation>(targetRelation, 'joiningTable')) {
			return this.buildManyHasManySubquery(
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

	private buildManyHasManySubquery(
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
