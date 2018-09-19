import { acceptFieldVisitor } from '../../../content-schema/modelUtils'
import { Input, Model } from 'cms-common'
import Path from './Path'
import JoinBuilder from './JoinBuilder'
import ConditionBuilder from './ConditionBuilder'
import { isIt } from '../../../utils/type'
import QueryBuilder from '../../../core/knex/QueryBuilder'
import SqlConditionBuilder from '../../../core/knex/ConditionBuilder'

export default class WhereBuilder {
	constructor(
		private readonly schema: Model.Schema,
		private readonly joinBuilder: JoinBuilder,
		private readonly conditionBuilder: ConditionBuilder
	) {}

	public build(qb: QueryBuilder, entity: Model.Entity, path: Path, where: Input.Where): void {
		qb.where(clause => this.buildInternal(qb, clause, entity, path, where, false))
	}

	public buildInternal(
		qb: QueryBuilder,
		whereClause: SqlConditionBuilder,
		entity: Model.Entity,
		path: Path,
		where: Input.Where,
		allowManyJoin: boolean = false
	): void {
		const tableName = path.getAlias()

		if (where.and !== undefined && where.and.length > 0) {
			const expr = where.and
			whereClause.and(clause => expr.map((where: Input.Where) => this.buildInternal(qb, clause, entity, path, where)))
		}
		if (where.or !== undefined && where.or.length > 0) {
			const expr = where.or
			whereClause.and(clause =>
				expr.map((where: Input.Where) => clause.or(clause => this.buildInternal(qb, clause, entity, path, where)))
			)
		}
		if (where.not !== undefined) {
			const expr = where.not
			whereClause.not(clause => this.buildInternal(qb, clause, entity, path, expr))
		}

		for (const fieldName in where) {
			if (fieldName === 'and' || fieldName === 'or' || fieldName === 'not') {
				continue
			}

			const joinedWhere = (entity: Model.Entity, relation: Model.Relation, targetEntity: Model.Entity) => {
				const targetPath = path.for(fieldName)
				const relationWhere = where[fieldName] as Input.Where
				if (Object.keys(relationWhere).length === 0) {
					return
				}
				if (isIt<Model.JoiningColumnRelation>(relation, 'joiningColumn')) {
					const primaryCondition = this.transformWhereToPrimaryCondition(relationWhere, targetEntity.primary)
					if (primaryCondition !== null) {
						this.conditionBuilder.build(whereClause, tableName, relation.joiningColumn.columnName, primaryCondition)
						return
					}
				}

				this.joinBuilder.join(qb, targetPath, entity, relation.name)

				this.buildInternal(qb, whereClause, targetEntity, targetPath, relationWhere)
			}

			acceptFieldVisitor(this.schema, entity, fieldName, {
				visitColumn: (entity, column) => {
					const condition: Input.Condition<Input.ColumnValue> = where[column.name] as Input.Condition<Input.ColumnValue>
					this.conditionBuilder.build(whereClause, tableName, column.columnName, condition)
				},
				visitOneHasOneInversed: joinedWhere,
				visitOneHasOneOwner: joinedWhere,
				visitManyHasOne: joinedWhere,
				visitManyHasManyInversed: (entity, relation, targetEntity, targetRelation) => {
					if (allowManyJoin) {
						joinedWhere(entity, relation, targetEntity)
						return
					}
					const relationWhere = where[fieldName] as Input.Where

					whereClause.in([tableName, entity.primaryColumn], qb =>
						this.createManyHasManySubquery(qb, relationWhere, targetEntity, targetRelation.joiningTable, 'inversed')
					)
				},
				visitManyHasManyOwner: (entity, relation, targetEntity) => {
					if (allowManyJoin) {
						joinedWhere(entity, relation, targetEntity)
						return
					}

					const relationWhere = where[fieldName] as Input.Where

					whereClause.in([tableName, entity.primaryColumn], qb =>
						this.createManyHasManySubquery(qb, relationWhere, targetEntity, relation.joiningTable, 'owner')
					)
				},
				visitOneHasMany: (entity, relation, targetEntity, targetRelation) => {
					if (allowManyJoin) {
						joinedWhere(entity, relation, targetEntity)
						return
					}

					const relationWhere = where[fieldName] as Input.Where

					whereClause.in([tableName, entity.primaryColumn], qb => {
						qb.select(['root_', targetRelation.joiningColumn.columnName])
						qb.from(targetEntity.tableName, 'root_')
						qb.where(clause => this.buildInternal(qb, clause, targetEntity, new Path([]), relationWhere, true))
					})
				}
			})
		}
	}

	private createManyHasManySubquery(
		qb: QueryBuilder,
		relationWhere: Input.Where,
		targetEntity: Model.Entity,
		joiningTable: Model.JoiningTable,
		fromSide: 'owner' | 'inversed'
	) {
		const fromColumn =
			fromSide === 'owner' ? joiningTable.joiningColumn.columnName : joiningTable.inverseJoiningColumn.columnName
		const toColumn =
			fromSide === 'owner' ? joiningTable.inverseJoiningColumn.columnName : joiningTable.joiningColumn.columnName
		qb.from(joiningTable.tableName, 'junction_')
		qb.select(['junction_', fromColumn])
		const primaryCondition = this.transformWhereToPrimaryCondition(relationWhere, targetEntity.primary)
		if (primaryCondition !== null) {
			qb.where(whereClause => this.conditionBuilder.build(whereClause, 'junction_', toColumn, primaryCondition))
			return
		}

		qb.join(targetEntity.tableName, 'root_', clause =>
			clause.compareColumns(['junction_', toColumn], SqlConditionBuilder.Operator.eq, ['root_', targetEntity.primary])
		)
		qb.where(clause => this.buildInternal(qb, clause, targetEntity, new Path([]), relationWhere, true))
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
