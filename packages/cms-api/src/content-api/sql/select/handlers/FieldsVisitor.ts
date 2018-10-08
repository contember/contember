import { Acl, Input, Model } from 'cms-common'
import ObjectNode from '../../../graphQlResolver/ObjectNode'
import SelectHydrator from '../SelectHydrator'
import Mapper from '../../Mapper'
import FieldNode from '../../../graphQlResolver/FieldNode'
import JunctionFetcher from '../JunctionFetcher'
import SelectExecutionHandler from '../SelectExecutionHandler'
import PredicateFactory from '../../../../acl/PredicateFactory'
import WhereBuilder from '../WhereBuilder'

class FieldsVisitor implements Model.RelationByTypeVisitor<void>, Model.ColumnVisitor<void> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly junctionFetcher: JunctionFetcher,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
		private readonly mapper: Mapper,
		private readonly executionContext: SelectExecutionHandler.Context
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
				qb.select([tableAlias, column.columnName], columnAlias)
			} else {
				qb.select(
					expr =>
						expr.case(caseExpr =>
							caseExpr
								.when(
									whenExpr =>
										whenExpr.selectCondition(condition =>
											this.whereBuilder.buildInternal(qb, condition, entity, columnPath.back(), fieldPredicate)
										),
									thenExpr => thenExpr.select([tableAlias, column.columnName])
								)
								.else(elseExpr => elseExpr.raw('null'))
						),
					columnAlias
				)
			}
		})
	}

	public visitManyHasManyInversed(
		entity: Model.Entity,
		relation: Model.ManyHasManyInversedRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyOwnerRelation
	): void {
		const joiningTable = targetRelation.joiningTable
		const columns: Mapper.JoiningColumns = {
			sourceColumn: joiningTable.inverseJoiningColumn,
			targetColumn: joiningTable.joiningColumn,
		}

		this.createManyHasManyGroups(targetEntity, targetRelation, columns)
	}

	public visitManyHasManyOwner(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		targetEntity: Model.Entity
	): void {
		const joiningTable = relation.joiningTable
		const columns: Mapper.JoiningColumns = {
			sourceColumn: joiningTable.joiningColumn,
			targetColumn: joiningTable.inverseJoiningColumn,
		}

		this.createManyHasManyGroups(targetEntity, relation, columns)
	}

	public visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation
	): void {
		this.executionContext.addData(
			entity.primary,
			async ids => {
				const objectNode = this.executionContext.field as ObjectNode
				const whereWithParentId = {
					...objectNode.args.where,
					[targetRelation.name]: { [entity.primary]: { in: ids } },
				}
				const objectNodeWithWhere = objectNode.withArg<Input.ListQueryInput>('where', whereWithParentId)

				return this.mapper.selectGrouped(targetEntity, objectNodeWithWhere, targetRelation)
			},
			[]
		)
	}

	private createManyHasManyGroups(
		targetEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		joiningColumns: Mapper.JoiningColumns
	): void {
		this.executionContext.addData(
			this.executionContext.entity.primary,
			async ids => {
				const objectNode = this.executionContext.field as ObjectNode
				const junctionValues = await this.junctionFetcher.fetchJunction(
					relation,
					ids,
					joiningColumns,
					targetEntity,
					objectNode
				)

				const primaryField = new FieldNode(targetEntity.primary, targetEntity.primary, {})
				const inversedJoiningColumn = joiningColumns.targetColumn.columnName
				const inversedIds = junctionValues
					.map((it: any) => it[inversedJoiningColumn])
					.filter((it, index, arr) => arr.indexOf(it) === index)

				const queryWithWhere = objectNode
					.withArgs({
						where: {
							[targetEntity.primary]: { in: inversedIds },
						},
					})
					.withField(primaryField)
				const result = await this.mapper.select(targetEntity, queryWithWhere)

				return this.buildManyHasManyGroups(targetEntity, joiningColumns, result, junctionValues)
			},
			[]
		)
	}

	private buildManyHasManyGroups(
		entity: Model.Entity,
		joiningColumns: Mapper.JoiningColumns,
		resultObjects: SelectHydrator.ResultObjects,
		junctionValues: SelectHydrator.Rows
	): SelectHydrator.GroupedObjects {
		const dataById: { [id: string]: SelectHydrator.ResultObject } = {}
		for (let object of resultObjects) {
			dataById[object[entity.primary]] = object
		}
		const sourceColumn = joiningColumns.sourceColumn.columnName
		const targetColumn = joiningColumns.targetColumn.columnName
		const groupedResult: { [id: string]: SelectHydrator.ResultObjects } = {}
		for (let pair of junctionValues) {
			if (!groupedResult[pair[sourceColumn]]) {
				groupedResult[pair[sourceColumn]] = []
			}
			const resultObject = dataById[pair[targetColumn]]
			if (resultObject) {
				groupedResult[pair[sourceColumn]].push(resultObject)
			}
		}
		return groupedResult
	}

	public visitOneHasOneInversed(
		entity: Model.Entity,
		relation: Model.OneHasOneInversedRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneOwnerRelation
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
					and: [idsWhere, objectNode.args.where].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = objectNode.withArg('where', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetRelation.name)
			},
			null
		)
	}

	public visitOneHasOneOwner(
		entity: Model.Entity,
		relation: Model.OneHasOneOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneInversedRelation | null
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
					and: [idsWhere, objectNode.args.where].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = objectNode.withArg('where', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetEntity.primary)
			},
			null
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
					and: [idsWhere, objectNode.args.where].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = objectNode.withArg('where', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetEntity.primary)
			},
			null
		)
	}
}

export default FieldsVisitor
