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
		private readonly useExistsInHasManyFilter: boolean,
	) {}

	public build(
		qb: SelectBuilder<SelectBuilder.Result>,
		entity: Model.Entity,
		path: Path,
		where: Input.OptionalWhere,
		optimizationHints: WhereOptimizationHints = {},
	) {
		const optimizedWhere = this.whereOptimizer.optimize(where, entity, optimizationHints)
		return this.buildInternal({
			entity,
			path,
			where: optimizedWhere,
			callback: cb => qb.where(clause => cb(clause)),
			allowManyJoin: false,
		})
	}


	public buildAdvanced(
		entity: Model.Entity,
		path: Path,
		where: Input.OptionalWhere,
		callback: (clauseCb: (clause: SqlConditionBuilder) => SqlConditionBuilder) => SelectBuilder<SelectBuilder.Result>,
		optimizationHints: WhereOptimizationHints = {},
	) {
		const optimizedWhere = this.whereOptimizer.optimize(where, entity, optimizationHints)
		return this.buildInternal({
			entity,
			path,
			where: optimizedWhere,
			callback,
			allowManyJoin: false,
		})
	}

	private buildInternal({
		callback,
		...args
	}: { entity: Model.Entity; path: Path; where: Input.OptionalWhere; callback: (clauseCb: (clause: SqlConditionBuilder) => SqlConditionBuilder) => SelectBuilder<SelectBuilder.Result>; allowManyJoin: boolean },
	) {
		const joinList: WhereJoinDefinition[] = []

		const qbWithWhere = callback(clause => this.buildRecursive({
			conditionBuilder: clause,
			joinList: joinList,
			...args,
		}))
		return joinList.reduce<SelectBuilder<SelectBuilder.Result>>(
			(qb, { path, entity, relationName }) => this.joinBuilder.join(qb, path, entity, relationName),
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
	}: { conditionBuilder: SqlConditionBuilder; entity: Model.Entity; path: Path; where: Input.OptionalWhere; joinList: WhereJoinDefinition[]; allowManyJoin: boolean },
	): SqlConditionBuilder {
		const tableName = path.alias

		if (where.and !== undefined && where.and.length > 0) {
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
							: clause2.and(clause3 => this.buildRecursive({
								conditionBuilder: clause3,
								entity,
								path,
								where,
								joinList,
								allowManyJoin,
							})),
					clause,
				),
			)
		}
		if (where.not !== undefined) {
			const expr = where.not
			conditionBuilder = conditionBuilder.not(clause =>
				this.buildRecursive({
					conditionBuilder: clause,
					entity,
					path,
					where: expr,
					joinList,
					allowManyJoin,
				}),
			)
		}

		for (const fieldName in where) {
			if (fieldName === 'and' || fieldName === 'or' || fieldName === 'not') {
				continue
			}

			const targetPath = path.for(fieldName)

			const joinedWhere = ({ targetEntity, relation, entity }: Model.AnyRelationContext): SqlConditionBuilder => {
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
					const subWhere: Input.Condition<Input.ColumnValue> = where[column.name] as Input.Condition<Input.ColumnValue>
					return this.conditionBuilder.build(conditionBuilder, tableName, column.columnName, column.columnType, subWhere)
				},
				visitOneHasOneInverse: joinedWhere,
				visitOneHasOneOwning: joinedWhere,
				visitManyHasOne: joinedWhere,
				visitManyHasManyInverse: context => {
					if (allowManyJoin && !this.useExistsInHasManyFilter) {
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
							targetPath,
						),
					)
				},
				visitManyHasManyOwning: context => {
					if (allowManyJoin && !this.useExistsInHasManyFilter) {
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
							targetPath,
						),
					)
				},
				visitOneHasMany: context => {
					if (allowManyJoin && !this.useExistsInHasManyFilter) {
						return joinedWhere(context)
					}

					const relationWhere = where[fieldName] as Input.Where

					const qb = this.hasRootIsNull(relationWhere, context.targetEntity)
						? SelectBuilder.create()
							.select(it => it.raw('1'))
							.from(new Literal(`(select ${wrapIdentifier(tableName)}.${wrapIdentifier(entity.primaryColumn)})`), targetPath.for('tmp_').alias)
							.leftJoin(context.targetEntity.tableName, targetPath.alias, it =>
								it.columnsEq([targetPath.for('tmp_').alias, entity.primaryColumn], [targetPath.alias, context.targetRelation.joiningColumn.columnName]),
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
		relationWhere: Input.Where,
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

			const columnType = (targetEntity.fields[targetEntity.primary] as Model.AnyColumn).columnType

			return qb.where(condition =>
				this.conditionBuilder.build(condition, junctionPath.alias, toColumn, columnType, primaryCondition),
			)
		}

		const qbJoined = qb.join(targetEntity.tableName, path.alias, clause =>
			clause.compareColumns([junctionPath.alias, toColumn], Operator.eq, [path.alias, targetEntity.primary]),
		)
		return this.buildInternal({
			entity: targetEntity,
			path: this.pathFactory.create([], path.fullAlias),
			where: relationWhere,
			callback: cb => qbJoined.where(clause => cb(clause)),
			allowManyJoin: true,
		})
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
