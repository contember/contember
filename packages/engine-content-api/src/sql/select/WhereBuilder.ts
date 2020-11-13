import { isIt } from '../../utils'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { Input, Model } from '@contember/schema'
import Path, { PathFactory } from './Path'
import JoinBuilder from './JoinBuilder'
import ConditionBuilder from './ConditionBuilder'
import { ConditionBuilder as SqlConditionBuilder, Operator, SelectBuilder } from '@contember/database'

class WhereBuilder {
	constructor(
		private readonly schema: Model.Schema,
		private readonly joinBuilder: JoinBuilder,
		private readonly conditionBuilder: ConditionBuilder,
		private readonly pathFactory: PathFactory,
	) {}

	public build(
		qb: SelectBuilder<SelectBuilder.Result>,
		entity: Model.Entity,
		path: Path,
		where: Input.Where,
		allowManyJoin: boolean = false,
	) {
		return this.buildAdvanced(entity, path, where, cb => qb.where(clause => cb(clause)), allowManyJoin)
	}

	public buildAdvanced(
		entity: Model.Entity,
		path: Path,
		where: Input.Where,
		callback: (clauseCb: (clause: SqlConditionBuilder) => SqlConditionBuilder) => SelectBuilder<SelectBuilder.Result>,
		allowManyJoin: boolean = false,
	) {
		const joinList: WhereBuilder.JoinDefinition[] = []

		const qbWithWhere = callback(clause => this.buildInternal(clause, entity, path, where, allowManyJoin, joinList))
		return joinList.reduce<SelectBuilder<SelectBuilder.Result>>(
			(qb, { path, entity, relationName }) => this.joinBuilder.join(qb, path, entity, relationName),
			qbWithWhere,
		)
	}

	private buildInternal(
		conditionBuilder: SqlConditionBuilder,
		entity: Model.Entity,
		path: Path,
		where: Input.Where,
		allowManyJoin: boolean,
		joinList: WhereBuilder.JoinDefinition[],
	): SqlConditionBuilder {
		const tableName = path.getAlias()

		if (where.and !== undefined && where.and.length > 0) {
			const expr = where.and
			conditionBuilder = conditionBuilder.and(clause =>
				expr.reduce(
					(clause2, where: Input.Where) => this.buildInternal(clause2, entity, path, where, allowManyJoin, joinList),
					clause,
				),
			)
		}
		if (where.or !== undefined && where.or.length > 0) {
			const expr = where.or
			conditionBuilder = conditionBuilder.or(clause =>
				expr.reduce(
					(clause2, where: Input.Where) =>
						clause2.and(clause3 => this.buildInternal(clause3, entity, path, where, allowManyJoin, joinList)),
					clause,
				),
			)
		}
		if (where.not !== undefined) {
			const expr = where.not
			conditionBuilder = conditionBuilder.not(clause =>
				this.buildInternal(clause, entity, path, expr, allowManyJoin, joinList),
			)
		}

		for (const fieldName in where) {
			if (fieldName === 'and' || fieldName === 'or' || fieldName === 'not') {
				continue
			}

			const joinedWhere = (
				entity: Model.Entity,
				relation: Model.Relation,
				targetEntity: Model.Entity,
			): SqlConditionBuilder => {
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
							primaryCondition,
						)
					}
				}

				joinList.push({ path: targetPath, entity, relationName: relation.name })

				return this.buildInternal(conditionBuilder, targetEntity, targetPath, relationWhere, allowManyJoin, joinList)
			}

			conditionBuilder = acceptFieldVisitor<SqlConditionBuilder>(this.schema, entity, fieldName, {
				visitColumn: (entity, column) => {
					const subWhere: Input.Condition<Input.ColumnValue> = where[column.name] as Input.Condition<Input.ColumnValue>
					return this.conditionBuilder.build(conditionBuilder, tableName, column.columnName, subWhere)
				},
				visitOneHasOneInversed: joinedWhere,
				visitOneHasOneOwner: joinedWhere,
				visitManyHasOne: joinedWhere,
				visitManyHasManyInversed: (entity, relation, targetEntity, targetRelation) => {
					if (allowManyJoin) {
						return joinedWhere(entity, relation, targetEntity)
					}
					const relationWhere = where[fieldName] as Input.Where

					return conditionBuilder.in(
						[tableName, entity.primaryColumn],
						this.createManyHasManySubquery(
							SelectBuilder.create(),
							relationWhere,
							targetEntity,
							targetRelation.joiningTable,
							'inversed',
						),
					)
				},
				visitManyHasManyOwner: (entity, relation, targetEntity) => {
					if (allowManyJoin) {
						return joinedWhere(entity, relation, targetEntity)
					}

					const relationWhere = where[fieldName] as Input.Where

					return conditionBuilder.in(
						[tableName, entity.primaryColumn],
						this.createManyHasManySubquery(
							SelectBuilder.create(),
							relationWhere,
							targetEntity,
							relation.joiningTable,
							'owner',
						),
					)
				},
				visitOneHasMany: (entity, relation, targetEntity, targetRelation) => {
					if (allowManyJoin) {
						return joinedWhere(entity, relation, targetEntity)
					}

					const relationWhere = where[fieldName] as Input.Where

					return conditionBuilder.in(
						[tableName, entity.primaryColumn],
						this.build(
							SelectBuilder.create()
								.select(['root_', targetRelation.joiningColumn.columnName])
								.from(targetEntity.tableName, 'root_'),
							targetEntity,
							this.pathFactory.create([]),
							relationWhere,
							true,
						),
					)
				},
			})
		}
		return conditionBuilder
	}

	private createManyHasManySubquery(
		qb: SelectBuilder<SelectBuilder.Result>,
		relationWhere: Input.Where,
		targetEntity: Model.Entity,
		joiningTable: Model.JoiningTable,
		fromSide: 'owner' | 'inversed',
	) {
		let augmentedBuilder: SelectBuilder<SelectBuilder.Result> = qb
		const fromColumn =
			fromSide === 'owner' ? joiningTable.joiningColumn.columnName : joiningTable.inverseJoiningColumn.columnName
		const toColumn =
			fromSide === 'owner' ? joiningTable.inverseJoiningColumn.columnName : joiningTable.joiningColumn.columnName
		augmentedBuilder = augmentedBuilder.from(joiningTable.tableName, 'junction_').select(['junction_', fromColumn])
		const primaryCondition = this.transformWhereToPrimaryCondition(relationWhere, targetEntity.primary)
		if (primaryCondition !== null) {
			return augmentedBuilder.where(condition =>
				this.conditionBuilder.build(condition, 'junction_', toColumn, primaryCondition),
			)
		}

		augmentedBuilder = augmentedBuilder.join(targetEntity.tableName, 'root_', clause =>
			clause.compareColumns(['junction_', toColumn], Operator.eq, ['root_', targetEntity.primary]),
		)
		return this.buildAdvanced(
			targetEntity,
			this.pathFactory.create([]),
			relationWhere,
			cb => augmentedBuilder.where(clause => cb(clause)),
			true,
		)
	}

	private transformWhereToPrimaryCondition(where: Input.Where, primaryField: string): Input.Condition<never> | null {
		const keys = Object.keys(where)
		if (keys.filter(it => !['and', 'or', 'not', primaryField].includes(it)).length > 0) {
			return null
		}
		let condition: Input.Condition<never> = {}
		if (where.and) {
			const conditions = where.and.map(it => this.transformWhereToPrimaryCondition(it, primaryField))
			if (conditions.includes(null)) {
				return null
			}
			condition.and = conditions as Input.Condition<never>[]
		}
		if (where.or) {
			const conditions = where.or.map(it => this.transformWhereToPrimaryCondition(it, primaryField))
			if (conditions.includes(null)) {
				return null
			}
			condition.or = conditions as Input.Condition<never>[]
		}
		if (where.not) {
			const condition = this.transformWhereToPrimaryCondition(where.not, primaryField)
			if (condition === null) {
				return null
			}
			condition.not = condition as Input.Condition<never>
		}
		if (where[primaryField]) {
			if (Object.keys(condition).length > 0) {
				return { and: [condition, where[primaryField] as Input.Condition<never>] }
			}
			return where[primaryField] as Input.Condition<never>
		}
		return condition
	}
}

namespace WhereBuilder {
	export type JoinDefinition = { path: Path; entity: Model.Entity; relationName: string }
}

export default WhereBuilder
