import { Acl, Input, Model, Value } from '@contember/schema'
import SelectHydrator from '../SelectHydrator'
import Mapper from '../../Mapper'
import JunctionFetcher from '../JunctionFetcher'
import SelectExecutionHandler from '../SelectExecutionHandler'
import PredicateFactory from '../../../acl/PredicateFactory'
import WhereBuilder from '../WhereBuilder'
import { OrderByHelper } from '../OrderByHelper'
import { FieldNode, ObjectNode } from '../../../inputProcessing'

class FieldsVisitor implements Model.RelationByTypeVisitor<void>, Model.ColumnVisitor<void> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly junctionFetcher: JunctionFetcher,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
		private readonly mapper: Mapper,
		private readonly executionContext: SelectExecutionHandler.Context,
	) {}

	visitColumn(entity: Model.Entity, column: Model.AnyColumn): void {
		const columnPath = this.executionContext.path
		this.executionContext.addColumn(qb => {
			const tableAlias = columnPath.back().getAlias()
			const columnAlias = columnPath.getAlias()

			const fieldPredicate =
				entity.primary === column.name
					? undefined
					: this.predicateFactory.create(entity, Acl.Operation.read, [column.name])

			if (!fieldPredicate || Object.keys(fieldPredicate).length === 0) {
				return qb.select([tableAlias, column.columnName], columnAlias)
			}
			return this.whereBuilder.buildAdvanced(entity, columnPath.back(), fieldPredicate, cb =>
				qb.select(
					expr =>
						expr.case(caseExpr =>
							caseExpr
								.when(
									whenExpr => whenExpr.selectCondition(cb),
									thenExpr => thenExpr.select([tableAlias, column.columnName]),
								)
								.else(elseExpr => elseExpr.raw('null')),
						),
					columnAlias,
				),
			)
		})
	}

	public visitManyHasManyInversed(
		entity: Model.Entity,
		relation: Model.ManyHasManyInversedRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyOwnerRelation,
	): void {
		const joiningTable = targetRelation.joiningTable
		const columns: Mapper.JoiningColumns = {
			sourceColumn: joiningTable.inverseJoiningColumn,
			targetColumn: joiningTable.joiningColumn,
		}

		this.createManyHasManyGroups(targetEntity, targetRelation, columns, relation.orderBy || [])
	}

	public visitManyHasManyOwner(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		targetEntity: Model.Entity,
	): void {
		const joiningTable = relation.joiningTable
		const columns: Mapper.JoiningColumns = {
			sourceColumn: joiningTable.joiningColumn,
			targetColumn: joiningTable.inverseJoiningColumn,
		}

		this.createManyHasManyGroups(targetEntity, relation, columns, relation.orderBy || [])
	}

	public visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation,
	): void {
		this.executionContext.addData(
			entity.primary,
			async ids => {
				const objectNode = this.executionContext.field as ObjectNode
				const targetRelationFilter = { [entity.primary]: { in: ids } }
				const whereWithParentId = {
					...objectNode.args.filter,
					[targetRelation.name]: !objectNode.args.filter?.[targetRelation.name]
						? targetRelationFilter
						: { and: [objectNode.args.filter[targetRelation.name], targetRelationFilter] },
				}
				const objectNodeWithWhere = objectNode.withArg<Input.ListQueryInput>('filter', whereWithParentId)
				const objectNodeWithOrder = OrderByHelper.appendDefaultOrderBy(
					entity,
					objectNodeWithWhere,
					relation.orderBy || [],
				)

				return this.mapper.selectGrouped(targetEntity, objectNodeWithOrder, targetRelation)
			},
			[],
		)
	}

	private createManyHasManyGroups(
		targetEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		joiningColumns: Mapper.JoiningColumns,
		defaultOrderBy: Model.OrderBy[],
	): void {
		this.executionContext.addData(
			this.executionContext.entity.primary,
			async ids => {
				const baseObjectNode = this.executionContext.field as ObjectNode<Input.ListQueryInput>
				const objectNode = OrderByHelper.appendDefaultOrderBy(targetEntity, baseObjectNode, defaultOrderBy)

				const junctionValues = await this.junctionFetcher.fetchJunction(
					this.mapper.db,
					relation,
					ids,
					joiningColumns,
					targetEntity,
					objectNode,
				)
				if (junctionValues.length === 0) {
					return {}
				}

				const primaryField = new FieldNode(targetEntity.primary, targetEntity.primary, {})
				const inversedJoiningColumn = joiningColumns.targetColumn.columnName
				const inversedIds = junctionValues
					.map(it => it[inversedJoiningColumn])
					.filter((it, index, arr) => arr.indexOf(it) === index)

				const queryWithWhere = objectNode
					.withArgs({
						filter: {
							[targetEntity.primary]: { in: inversedIds },
						},
					})
					.withField(primaryField)
				const result = await this.mapper.select(targetEntity, queryWithWhere)

				return this.buildManyHasManyGroups(targetEntity, joiningColumns, result, junctionValues)
			},
			[],
		)
	}

	private buildManyHasManyGroups(
		entity: Model.Entity,
		joiningColumns: Mapper.JoiningColumns,
		resultObjects: SelectHydrator.ResultObjects,
		junctionValues: SelectHydrator.Rows,
	): SelectHydrator.GroupedObjects {
		const dataById: { [id: string]: SelectHydrator.ResultObject } = {}
		for (let object of resultObjects) {
			dataById[object[entity.primary] as Value.PrimaryValue] = object
		}
		const sourceColumn = joiningColumns.sourceColumn.columnName
		const targetColumn = joiningColumns.targetColumn.columnName
		const groupedResult: { [id: string]: SelectHydrator.ResultObjects } = {}
		for (let pair of junctionValues) {
			if (!groupedResult[pair[sourceColumn] as Value.PrimaryValue]) {
				groupedResult[pair[sourceColumn] as Value.PrimaryValue] = []
			}
			const resultObject = dataById[pair[targetColumn] as Value.PrimaryValue]
			if (resultObject) {
				groupedResult[pair[sourceColumn] as Value.PrimaryValue].push(resultObject)
			}
		}
		return groupedResult
	}

	public visitOneHasOneInversed(
		entity: Model.Entity,
		relation: Model.OneHasOneInversedRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneOwnerRelation,
	): void {
		this.executionContext.addData(
			entity.primary,
			async ids => {
				const idsWhere: Input.Where = {
					[targetRelation.name]: {
						[entity.primary]: {
							in: ids,
						},
					},
				}
				const objectNode = this.executionContext.field as ObjectNode
				const where: Input.Where = {
					and: [idsWhere, objectNode.args.filter].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = objectNode.withArg('filter', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetRelation.name)
			},
			null,
		)
	}

	public visitOneHasOneOwner(
		entity: Model.Entity,
		relation: Model.OneHasOneOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneInversedRelation | null,
	): void {
		this.executionContext.addData(
			relation.name,
			async ids => {
				const idsWhere: Input.Where = {
					[targetEntity.primary]: {
						in: ids,
					},
				}
				const objectNode = this.executionContext.field as ObjectNode
				const where: Input.Where = {
					and: [idsWhere, objectNode.args.filter].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = objectNode.withArg('filter', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetEntity.primary)
			},
			null,
		)
	}

	public visitManyHasOne(entity: Model.Entity, relation: Model.ManyHasOneRelation, targetEntity: Model.Entity): void {
		this.executionContext.addData(
			relation.name,
			async ids => {
				const idsWhere: Input.Where = {
					[targetEntity.primary]: {
						in: ids,
					},
				}
				const objectNode = this.executionContext.field as ObjectNode
				const where: Input.Where = {
					and: [idsWhere, objectNode.args.filter].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = objectNode.withArg('filter', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetEntity.primary)
			},
			null,
		)
	}
}

export default FieldsVisitor
