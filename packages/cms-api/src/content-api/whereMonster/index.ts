import { Input, Model } from 'cms-common'
import { acceptFieldVisitor, acceptRelationTypeVisitor } from '../../content-schema/modelUtils'
import { expression, quoteIdentifier } from '../sql/utils'
import { arrayEquals } from '../../utils/arrays'
import buildCondition from './conditionBuilder'

class SubQueryBuilder {
	public schema: Model.Schema
	public rootEntity: Model.Entity

	private joins: string[][] = []

	constructor(schema: Model.Schema, rootEntity: Model.Entity) {
		this.schema = schema
		this.rootEntity = rootEntity
	}

	public getSql(): string {
		const rootAlias = this.alias([])
		const joins = this.buildJoins()
		return `SELECT ${quoteIdentifier(rootAlias, this.rootEntity.primaryColumn)}
    FROM ${quoteIdentifier(this.rootEntity.tableName)} AS ${quoteIdentifier(rootAlias)}
   ${joins}
    `
	}

	public join(joinPath: string[]) {
		this.joins.push(joinPath)
		return this.alias(joinPath)
	}

	private buildJoins(): string {
		const sqlExpr: string[] = []
		const joined: string[][] = []
		for (const joinPath of this.joins) {
			let currentFrom = this.rootEntity
			for (let i = 0; i < joinPath.length; i++) {
				const partialJoinPath = joinPath.slice(0, i + 1)

				const targetEntity = acceptFieldVisitor(this.schema, currentFrom, joinPath[i], {
					visitColumn: () => {
						throw new Error()
					},
					visitRelation: (entity, relation, targetEntity) => {
						return targetEntity
					}
				})

				if (joined.find(it => arrayEquals(it, partialJoinPath)) !== undefined) {
					currentFrom = targetEntity
					continue
				}
				joined.push(partialJoinPath)

				const fromAlias = this.alias(joinPath.slice(0, i))
				const toAlias = this.alias(partialJoinPath)

				const join = (tableName: string, as: string, fromAlias: string) => (
					fromColumn: string,
					toColumn: string
				): string => {
					return `JOIN ${quoteIdentifier(tableName)} AS ${quoteIdentifier(as)}
            ON ${quoteIdentifier(fromAlias, fromColumn)} = ${quoteIdentifier(as, toColumn)}`
				}

				const joinTargetEntity = join(targetEntity.tableName, toAlias, fromAlias)

				acceptRelationTypeVisitor(this.schema, currentFrom, joinPath[i], {
					visitOneHasOneOwner: (entity, relation, targetEntity) => {
						sqlExpr.push(joinTargetEntity(relation.joiningColumn.columnName, targetEntity.primaryColumn))
					},
					visitOneHasOneInversed: (entity, relation, targetEntity, targetRelation) => {
						sqlExpr.push(joinTargetEntity(entity.primaryColumn, targetRelation.joiningColumn.columnName))
					},
					visitManyHasOne: (entity, relation, targetEntity) => {
						sqlExpr.push(joinTargetEntity(relation.joiningColumn.columnName, targetEntity.primaryColumn))
					},
					visitOneHasMany: (entity, relation, targetEntity, targetRelation) => {
						sqlExpr.push(joinTargetEntity(entity.primaryColumn, targetRelation.joiningColumn.columnName))
					},
					visitManyHasManyOwner: (entity, relation, targetEntity) => {
						const joiningAlias = `${fromAlias}_x_${toAlias}`
						sqlExpr.push(
							join(relation.joiningTable.tableName, joiningAlias, fromAlias)(
								entity.primaryColumn,
								relation.joiningTable.joiningColumn.columnName
							)
						)
						sqlExpr.push(
							join(targetEntity.tableName, toAlias, joiningAlias)(
								relation.joiningTable.inverseJoiningColumn.columnName,
								targetEntity.primaryColumn
							)
						)
					},
					visitManyHasManyInversed: (entity, relation, targetEntity, targetRelation) => {
						const joiningAlias = `${fromAlias}_x_${toAlias}`
						sqlExpr.push(
							join(targetRelation.joiningTable.tableName, joiningAlias, fromAlias)(
								entity.primaryColumn,
								targetRelation.joiningTable.inverseJoiningColumn.columnName
							)
						)
						sqlExpr.push(
							join(targetEntity.tableName, toAlias, joiningAlias)(
								targetRelation.joiningTable.joiningColumn.columnName,
								targetEntity.primaryColumn
							)
						)
					}
				})
				currentFrom = targetEntity
			}
		}
		return sqlExpr.join('\n')
	}

	public alias(path: string[]) {
		return 'root_' + path.join('_')
	}
}

type JoinCallback = (joinPath: string[]) => string

const buildWhere = (
	schema: Model.Schema,
	entity: Model.Entity,
	joinCallback: JoinCallback,
	joinPath: string[] = [],
	canJoinHasMany: boolean = false
) => (tableName: string, where: Input.Where): string => {
	const buildWhereParts = (where: Input.Where): string[] => {
		const parts: string[] = []
		if (where.and !== undefined) {
			parts.push(expression.and(where.and.map((where: Input.Where) => expression.and(buildWhereParts(where)))))
		}
		if (where.or !== undefined) {
			parts.push(expression.or(where.or.map((where: Input.Where) => expression.and(buildWhereParts(where)))))
		}
		if (where.not !== undefined) {
			parts.push(expression.not(expression.and(buildWhereParts(where.not))))
		}
		for (const fieldName in where) {
			if (fieldName === 'and' || fieldName === 'or' || fieldName === 'not') {
				continue
			}

			const joinedWhere = (entity: Model.Entity, relation: Model.Relation, targetEntity: Model.Entity) => {
				const newJoinPath = [...joinPath, fieldName]
				const alias = joinCallback(newJoinPath)
				return buildWhere(schema, targetEntity, joinCallback, newJoinPath, canJoinHasMany)(
					quoteIdentifier(alias),
					where[fieldName] as Input.Where
				)
			}
			parts.push(
				acceptFieldVisitor(schema, entity, fieldName, {
					visitColumn: (entity, column) => {
						const condition: Input.Condition<any> = where[column.name]
						return buildCondition(tableName, column.columnName)(condition)
					},
					visitHasOne: joinedWhere,
					visitHasMany: (entity, relation, targetEntity) => {
						if (canJoinHasMany) {
							return joinedWhere(entity, relation, targetEntity)
						}
						const subQueryBuilder = new SubQueryBuilder(schema, entity)
						const whereExpr = buildWhere(
							schema,
							targetEntity,
							joinPath => subQueryBuilder.join(joinPath),
							[fieldName],
							true
						)(quoteIdentifier(subQueryBuilder.join([fieldName])), where[fieldName] as Input.Where)
						const fqn = `${tableName}.${quoteIdentifier(entity.primary)}`
						return `${fqn} IN (${subQueryBuilder.getSql()} WHERE ${whereExpr})`
					}
				})
			)
		}

		return parts
	}

	return expression.and(buildWhereParts(where))
}

export { buildWhere }
