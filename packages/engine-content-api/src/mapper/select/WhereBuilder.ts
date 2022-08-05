import { isIt } from '../../utils'
import { acceptFieldVisitor, isColumn } from '@contember/schema-utils'
import { Input, Model } from '@contember/schema'
import { Path, PathFactory } from './Path'
import { JoinBuilder } from './JoinBuilder'
import { ConditionBuilder } from './ConditionBuilder'
import {
	ConditionBuilder as SqlConditionBuilder,
	Literal,
	Operator,
	QueryBuilder,
	SelectBuilder, wrapIdentifier,
} from '@contember/database'
import { WhereOptimizationHints, WhereOptimizer } from './optimizer/WhereOptimizer'

export class WhereBuilder {
	constructor(
		private readonly schema: Model.Schema,
		private readonly joinBuilder: JoinBuilder,
		private readonly conditionBuilder: ConditionBuilder,
		private readonly pathFactory: PathFactory,
		private readonly whereOptimizer: WhereOptimizer,
	) {}

	public build<R extends SelectBuilder.Result>(
		qb: SelectBuilder<R>,
		entity: Model.Entity,
		path: Path,
		where: Input.OptionalWhere,
		optimizationHints: WhereOptimizationHints = {},
	): SelectBuilder<R> {
		const optimizedWhere = this.whereOptimizer.optimize(where, entity, optimizationHints)
		return this.buildInternal(entity, path, optimizedWhere, cb => qb.where(clause => cb(clause)), false)
	}


	public buildAdvanced<R extends SelectBuilder.Result>(
		entity: Model.Entity,
		path: Path,
		where: Input.OptionalWhere,
		callback: (clauseCb: (clause: SqlConditionBuilder) => SqlConditionBuilder) => SelectBuilder<R>,
		optimizationHints: WhereOptimizationHints = {},
	): SelectBuilder<R> {
		const optimizedWhere = this.whereOptimizer.optimize(where, entity, optimizationHints)
		return this.buildInternal(entity, path, optimizedWhere, callback, false)
	}

	private buildInternal<R extends SelectBuilder.Result>(
		entity: Model.Entity,
		path: Path,
		where: Input.OptionalWhere,
		callback: (clauseCb: (clause: SqlConditionBuilder) => SqlConditionBuilder) => SelectBuilder<R>,
		allowManyJoin: boolean,
	): SelectBuilder<R> {
		const joinList: WhereJoinDefinition[] = []

		const qbWithWhere = callback(clause => this.buildRecursive(clause, entity, path, where, allowManyJoin, joinList))
		return joinList.reduce<SelectBuilder<R>>(
			(qb, { path, entity, relationName }) => this.joinBuilder.join<R>(qb, path, entity, relationName),
			qbWithWhere,
		)
	}

	private buildRecursive(
		conditionBuilder: SqlConditionBuilder,
		entity: Model.Entity,
		path: Path,
		where: Input.OptionalWhere,
		allowManyJoin: boolean,
		joinList: WhereJoinDefinition[],
	): SqlConditionBuilder {
		const tableName = path.alias

		if (where.and !== undefined && where.and.length > 0) {
			const expr = where.and
			conditionBuilder = conditionBuilder.and(clause =>
				expr.reduce(
					(clause2, where) =>
						!where ? clause2 : this.buildRecursive(clause2, entity, path, where, allowManyJoin, joinList),
					clause,
				),
			)
		}
		if (where.or !== undefined && where.or.length > 0) {
			const expr = where.or
			conditionBuilder = conditionBuilder.or(clause =>
				expr.reduce(
					(clause2, where) =>
						!where
							? clause2
							: clause2.and(clause3 => this.buildRecursive(clause3, entity, path, where, allowManyJoin, joinList)),
					clause,
				),
			)
		}
		if (where.not !== undefined) {
			const expr = where.not
			conditionBuilder = conditionBuilder.not(clause =>
				this.buildRecursive(clause, entity, path, expr, allowManyJoin, joinList),
			)
		}

		for (const fieldName in where) {
			if (fieldName === 'and' || fieldName === 'or' || fieldName === 'not') {
				continue
			}

			const joinedWhere = ({ targetEntity, relation, entity }: Model.AnyRelationContext): SqlConditionBuilder => {
				const targetPath = path.for(fieldName)
				const relationWhere = where[fieldName] as Input.Where
				if (Object.keys(relationWhere).length === 0) {
					return conditionBuilder
				}
				if (isIt<Model.JoiningColumnRelation>(relation, 'joiningColumn')) {
					const primaryCondition = this.transformWhereToPrimaryCondition(relationWhere, targetEntity.primary)
					if (primaryCondition !== null) {
						return this.conditionBuilder.build(
							conditionBuilder,
							tableName,
							relation.joiningColumn.columnName,
							(targetEntity.fields[targetEntity.primary] as Model.AnyColumn).columnType,
							primaryCondition,
						)
					}
				}

				joinList.push({ path: targetPath, entity, relationName: relation.name })

				return this.buildRecursive(conditionBuilder, targetEntity, targetPath, relationWhere, allowManyJoin, joinList)
			}

			conditionBuilder = acceptFieldVisitor<SqlConditionBuilder>(this.schema, entity, fieldName, {
				visitColumn: ({ entity, column }) => {
					const subWhere: Input.Condition<Input.ColumnValue> = where[column.name] as Input.Condition<Input.ColumnValue>
					return this.conditionBuilder.build(conditionBuilder, tableName, column.columnName, column.columnType, subWhere)
				},
				visitOneHasOneInverse: joinedWhere,
				visitOneHasOneOwning: joinedWhere,
				visitManyHasOne: joinedWhere,
				visitManyHasManyInverse: context => {
					if (allowManyJoin) {
						return joinedWhere(context)
					}

					const relationWhere = where[fieldName] as Input.Where

					return conditionBuilder.exists(
						this.createManyHasManySubquery(
							[tableName, entity.primaryColumn],
							relationWhere,
							context.targetEntity,
							context.targetRelation.joiningTable,
							'inverse',
						),
					)
				},
				visitManyHasManyOwning: context => {
					if (allowManyJoin) {
						return joinedWhere(context)
					}

					const relationWhere = where[fieldName] as Input.Where

					return conditionBuilder.exists(
						this.createManyHasManySubquery(
							[tableName, entity.primaryColumn],
							relationWhere,
							context.targetEntity,
							context.relation.joiningTable,
							'owning',
						),
					)
				},
				visitOneHasMany: context => {
					if (allowManyJoin) {
						return joinedWhere(context)
					}

					const relationWhere = where[fieldName] as Input.Where

					const qb = this.hasRootIsNull(relationWhere, context.targetEntity)
						? SelectBuilder.create()
							.select(it => it.raw('1'))
							.from(new Literal(`(select ${wrapIdentifier(tableName)}.${wrapIdentifier(entity.primaryColumn)})`), 'sub2_')
							.leftJoin(context.targetEntity.tableName, 'sub_', it =>
								it.columnsEq(['sub2_', entity.primaryColumn], ['sub_', context.targetRelation.joiningColumn.columnName]),
							)
						: SelectBuilder.create()
							.select(it => it.raw('1'))
							.from(context.targetEntity.tableName, 'sub_')
							.where(it => it.columnsEq([tableName, entity.primaryColumn], ['sub_', context.targetRelation.joiningColumn.columnName]))

					return conditionBuilder.exists(
						this.buildInternal(
							context.targetEntity,
							this.pathFactory.create([], 'sub_'),
							relationWhere,
							cb => qb.where(clause => cb(clause)),
							true,
						),
					)
				},
			})
		}
		return conditionBuilder
	}


	private createManyHasManySubquery(
		outerColumn: QueryBuilder.ColumnIdentifier,
		relationWhere: Input.Where,
		targetEntity: Model.Entity,
		joiningTable: Model.JoiningTable,
		fromSide: 'owning' | 'inverse',
	) {
		const fromColumn = fromSide === 'owning' ? joiningTable.joiningColumn.columnName : joiningTable.inverseJoiningColumn.columnName
		const toColumn = fromSide === 'owning' ? joiningTable.inverseJoiningColumn.columnName : joiningTable.joiningColumn.columnName
		const qb = SelectBuilder.create<SelectBuilder.Result>()
			.from(joiningTable.tableName, 'junction_')
			.select(it => it.raw('1'))
			.where(it => it.columnsEq(outerColumn, ['junction_', fromColumn]))

		const primaryCondition = this.transformWhereToPrimaryCondition(relationWhere, targetEntity.primary)
		if (primaryCondition !== null) {

			const columnType = (targetEntity.fields[targetEntity.primary] as Model.AnyColumn).columnType

			return qb.where(condition =>
				this.conditionBuilder.build(condition, 'junction_', toColumn, columnType, primaryCondition),
			)
		}

		const qbJoined = qb.join(targetEntity.tableName, 'sub_', clause =>
			clause.compareColumns(['junction_', toColumn], Operator.eq, ['sub_', targetEntity.primary]),
		)
		return this.buildInternal(
			targetEntity,
			this.pathFactory.create([], 'sub_'),
			relationWhere,
			cb => qbJoined.where(clause => cb(clause)),
			true,
		)
	}

	private transformWhereToPrimaryCondition(where: Input.Where, primaryField: string): Input.Condition<never> | null {
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

	private hasRootIsNull(where: Input.Where, entity: Model.Entity): boolean {
		for (const key in where) {
			if (key === 'and' || key === 'or') {
				if (where[key]?.some(it => this.hasRootIsNull(it, entity))) {
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
		if (cond.and && cond.and.some(it => this.conditionHasIsNull(it))) {
			return true
		}
		if (cond.or && cond.or.some(it => this.conditionHasIsNull(it))) {
			return true
		}
		if (cond.not && this.conditionHasIsNull(cond.not)) {
			return true
		}
		return false
	}
}

export type WhereJoinDefinition = { path: Path; entity: Model.Entity; relationName: string }
