import { acceptFieldVisitor, getColumnName } from '../../../content-schema/modelUtils'
import { Input, Model } from 'cms-common'
import * as Knex from 'knex'
import Path from './Path'
import JoinBuilder from './JoinBuilder'
import ConditionBuilder from './ConditionBuilder'
import { isIt } from '../../../utils/type'

export default class WhereBuilder {
	constructor(
		private readonly schema: Model.Schema,
		private readonly joinBuilder: JoinBuilder,
		private readonly conditionBuilder: ConditionBuilder
	) {}

	public build(
		qb: Knex.QueryBuilder,
		entity: Model.Entity,
		path: Path,
		where: Input.Where,
		allowManyJoin: boolean = false
	): void {
		const tableName = path.getAlias()
		if (where.and !== undefined) {
			const expr = where.and
			qb.andWhere(qb => expr.map((where: Input.Where) => this.build(qb, entity, path, where)))
		}
		if (where.or !== undefined) {
			const expr = where.or
			qb.andWhere(qb => expr.map((where: Input.Where) => qb.orWhere(qb => this.build(qb, entity, path, where))))
		}
		if (where.not !== undefined) {
			const expr = where.not
			qb.whereNot(qb => this.build(qb, entity, path, expr))
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
						this.conditionBuilder.build(qb, tableName, relation.joiningColumn.columnName, primaryCondition)
						return
					}
				}

				this.joinBuilder.join(qb, targetPath, entity, relation.name)

				this.build(qb, targetEntity, targetPath, relationWhere)
			}

			acceptFieldVisitor(this.schema, entity, fieldName, {
				visitColumn: (entity, column) => {
					const condition: Input.Condition<Input.ColumnValue> = where[column.name] as Input.Condition<Input.ColumnValue>
					this.conditionBuilder.build(qb, tableName, column.columnName, condition)
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

					qb.whereIn(`${tableName}.${entity.primary}`, qb => {
						qb.select(`junction_.${targetRelation.joiningTable.inverseJoiningColumn.columnName}`).from(
							`${targetRelation.joiningTable.tableName} as junction_`
						)
						qb.join(
							`${targetEntity.tableName} as root_`,
							`junction_.${targetRelation.joiningTable.joiningColumn.columnName}`,
							`root_.${targetEntity.primary}`
						)
						this.build(qb, targetEntity, new Path([]), relationWhere, true)
					})
				},
				visitManyHasManyOwner: (entity, relation, targetEntity) => {
					if (allowManyJoin) {
						joinedWhere(entity, relation, targetEntity)
						return
					}

					const relationWhere = where[fieldName] as Input.Where

					qb.whereIn(`${tableName}.${entity.primary}`, qb => {
						qb.select(`junction_.${relation.joiningTable.joiningColumn.columnName}`).from(
							`${relation.joiningTable.tableName} as junction_`
						)
						qb.join(
							`${targetEntity.tableName} as root_`,
							`junction_.${relation.joiningTable.inverseJoiningColumn.columnName}`,
							`root_.${targetEntity.primary}`
						)
						this.build(qb, targetEntity, new Path([]), relationWhere, true)
					})
				},
				visitOneHasMany: (entity, relation, targetEntity, targetRelation) => {
					if (allowManyJoin) {
						joinedWhere(entity, relation, targetEntity)
						return
					}

					const relationWhere = where[fieldName] as Input.Where

					qb.whereIn(`${tableName}.${entity.primary}`, qb => {
						qb.select(`root_.${targetRelation.joiningColumn.columnName}`).from(`${targetEntity.tableName} as root_`)
						this.build(qb, targetEntity, new Path([]), relationWhere, true)
					})
				}
			})
		}
	}

	public buildUnique(qb: Knex.QueryBuilder, entity: Model.Entity, path: Path, where: Input.UniqueWhere): void {
		for (let field in where) {
			const columnName = getColumnName(this.schema, entity, field)
			qb.andWhere(`${path.getAlias()}.${columnName}`, where[field])
		}
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
