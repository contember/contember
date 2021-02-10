import { PathFactory } from './Path'
import { WhereBuilder } from './WhereBuilder'
import { Client, LimitByGroupWrapper, Operator, SelectBuilder } from '@contember/database'
import { Input, Model, Value } from '@contember/schema'
import { OrderByBuilder } from './OrderByBuilder'
import { PredicatesInjector } from '../../acl'
import { FieldNode, ObjectNode } from '../../inputProcessing'
import { JoiningColumns } from '../types'
import { OrderByHelper } from './OrderByHelper'
import { SelectGroupedObjects, SelectResultObject, SelectRow } from './SelectHydrator'
import { Mapper } from '../Mapper'

export class RelationFetcher {
	constructor(
		private readonly whereBuilder: WhereBuilder,
		private readonly orderBuilder: OrderByBuilder,
		private readonly predicateInjector: PredicatesInjector,
		private readonly pathFactory: PathFactory,
	) {}

	public async fetchOneHasManyGroups(
		mapper: Mapper,
		objectNode: ObjectNode<Input.ListQueryInput>,
		targetEntity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetRelation: Model.ManyHasOneRelation,
		ids: Input.PrimaryValue[],
	): Promise<SelectGroupedObjects> {
		const targetRelationFilter: Input.OptionalWhere = { [targetEntity.primary]: { in: ids } }
		const whereWithParentId: Input.OptionalWhere = {
			...objectNode.args.filter,
			[targetRelation.name]: !objectNode.args.filter?.[targetRelation.name]
				? targetRelationFilter
				: ({ and: [objectNode.args.filter[targetRelation.name], targetRelationFilter] } as Input.OptionalWhere),
		}
		const objectNodeWithWhere = objectNode.withArg<Input.ListQueryInput>('filter', whereWithParentId)
		const objectNodeWithOrder = OrderByHelper.appendDefaultOrderBy(
			targetEntity,
			objectNodeWithWhere,
			relation.orderBy || [],
		)

		return mapper.selectGrouped(targetEntity, objectNodeWithOrder, targetRelation)
	}

	public async fetchManyHasManyGroups(
		mapper: Mapper,
		field: ObjectNode<Input.ListQueryInput>,
		targetEntity: Model.Entity,
		fromRelation: Model.ManyHasManyOwningRelation | Model.ManyHasManyInverseRelation,
		owningRelation: Model.ManyHasManyOwningRelation,
		joiningColumns: JoiningColumns,
		ids: Input.PrimaryValue[],
	): Promise<SelectGroupedObjects> {
		const defaultOrderBy = fromRelation.orderBy || []
		const objectNode = OrderByHelper.appendDefaultOrderBy(targetEntity, field, defaultOrderBy)

		const junctionValues = await this.fetchJunction(
			mapper.db,
			owningRelation,
			ids,
			joiningColumns,
			targetEntity,
			objectNode,
		)
		if (junctionValues.length === 0) {
			return {}
		}

		const primaryField = new FieldNode(targetEntity.primary, targetEntity.primary, {})
		const inverseJoiningColumn = joiningColumns.targetColumn.columnName
		const inverseIds = junctionValues
			.map(it => it[inverseJoiningColumn])
			.filter((it, index, arr) => arr.indexOf(it) === index)

		const queryWithWhere = objectNode
			.withArgs({
				filter: {
					[targetEntity.primary]: { in: inverseIds },
				},
			})
			.withField(primaryField)
		const result = await mapper.select(targetEntity, queryWithWhere)

		return this.buildManyHasManyGroups(targetEntity, joiningColumns, result, junctionValues)
	}

	private buildManyHasManyGroups(
		entity: Model.Entity,
		joiningColumns: JoiningColumns,
		resultObjects: SelectResultObject[],
		junctionValues: SelectRow[],
	): SelectGroupedObjects {
		const dataById: { [id: string]: SelectResultObject } = {}
		for (let object of resultObjects) {
			dataById[object[entity.primary] as Value.PrimaryValue] = object
		}
		const sourceColumn = joiningColumns.sourceColumn.columnName
		const targetColumn = joiningColumns.targetColumn.columnName
		const groupedResult: SelectGroupedObjects = {}
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

	private async fetchJunction(
		db: Client,
		relation: Model.ManyHasManyOwningRelation,
		values: Input.PrimaryValue[],
		column: JoiningColumns,
		targetEntity: Model.Entity,
		object: ObjectNode<Input.ListQueryInput>,
	): Promise<Record<string, Value.AtomicValue>[]> {
		const joiningTable = relation.joiningTable

		const whereColumn = column.sourceColumn.columnName
		let qb = SelectBuilder.create()
			.from(joiningTable.tableName, 'junction_')
			.select(['junction_', joiningTable.inverseJoiningColumn.columnName])
			.select(['junction_', joiningTable.joiningColumn.columnName])
			.where(clause => clause.in(['junction_', whereColumn], values))

		const queryWithPredicates = object.withArg(
			'filter',
			this.predicateInjector.inject(targetEntity, object.args.filter || {}),
		)
		const where = queryWithPredicates.args.filter
		const hasWhere = where && Object.keys(where).length > 0
		const hasFieldOrderBy =
			object.args.orderBy &&
			object.args.orderBy.length > 0 &&
			!object.args.orderBy[0]._random &&
			object.args.orderBy[0]._randomSeeded === undefined

		if (hasWhere || hasFieldOrderBy) {
			const path = this.pathFactory.create([])
			qb = qb.join(targetEntity.tableName, path.getAlias(), condition =>
				condition.compareColumns(['junction_', column.targetColumn.columnName], Operator.eq, [
					path.getAlias(),
					targetEntity.primaryColumn,
				]),
			)
		}

		if (where && hasWhere) {
			qb = this.whereBuilder.build(qb, targetEntity, this.pathFactory.create([]), where)
		}

		const wrapper = new LimitByGroupWrapper(
			['junction_', column.sourceColumn.columnName],
			(orderable, qb) => {
				if (object.args.orderBy) {
					;[qb, orderable] = this.orderBuilder.build(
						qb,
						orderable,
						targetEntity,
						this.pathFactory.create([]),
						object.args.orderBy,
					)
				}
				return [orderable, qb]
			},
			object.args.offset,
			object.args.limit,
		)

		return await wrapper.getResult(qb, db)
	}
}
