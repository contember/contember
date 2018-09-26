import { Input, Model } from 'cms-common'
import ObjectNode from '../../graphQlResolver/ObjectNode'
import SelectHydrator from './SelectHydrator'
import Mapper from '../Mapper'
import FieldNode from '../../graphQlResolver/FieldNode'
import JunctionFetcher from './JunctionFetcher'
import KnexWrapper from '../../../core/knex/KnexWrapper'

class RelationFetchVisitor implements Model.RelationByTypeVisitor<void> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly junctionFetcher: JunctionFetcher,
		private readonly mapper: Mapper,
		private readonly db: KnexWrapper,
		private readonly parentIdsGetter: (fieldName: string) => PromiseLike<Input.PrimaryValue[]>,
		private readonly object: ObjectNode<Input.ListQueryInput>,
		private readonly dataCallback: RelationFetchVisitor.DataCallback
	) {}

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
		const groups = this.createManyHasManyGroups(entity, targetEntity, targetRelation, columns)
		this.dataCallback(entity.primary, groups, [])
	}

	public visitManyHasManyOwner(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyInversedRelation | null
	): void {
		const joiningTable = relation.joiningTable
		const columns: Mapper.JoiningColumns = {
			sourceColumn: joiningTable.joiningColumn,
			targetColumn: joiningTable.inverseJoiningColumn,
		}
		const groups = this.createManyHasManyGroups(entity, targetEntity, relation, columns)
		this.dataCallback(entity.primary, groups, [])
	}

	public visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation
	): void {
		this.dataCallback(
			entity.primary,
			(async () => {
				const whereWithParentId = {
					...this.object.args.where,
					[targetRelation.name]: { [entity.primary]: { in: await this.parentIdsGetter(entity.primary) } },
				}
				const objectNode = new ObjectNode<Input.ListQueryInput>(
					this.object.name,
					this.object.alias,
					this.object.fields,
					{
						...this.object.args,
						where: whereWithParentId,
					}
				)

				return this.mapper.selectGrouped(targetEntity, objectNode, targetRelation)
			})(),
			[]
		)
	}

	private async createManyHasManyGroups(
		entity: Model.Entity,
		targetEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		joiningColumns: Mapper.JoiningColumns
	): Promise<SelectHydrator.GroupedObjects> {
		const ids = await this.parentIdsGetter(entity.primary)
		const junctionValues = await this.junctionFetcher.fetchJunction(
			this.db,
			relation,
			ids,
			joiningColumns,
			targetEntity,
			this.object
		)

		const primaryField = new FieldNode(targetEntity.primary, targetEntity.primary)
		const inversedJoiningColumn = joiningColumns.targetColumn.columnName
		const inversedIds = junctionValues
			.map((it: any) => it[inversedJoiningColumn])
			.filter((it, index, arr) => arr.indexOf(it) === index)

		const objectNode = this.object

		const queryWithWhere = new ObjectNode<Input.ListQueryInput>(
			objectNode.name,
			objectNode.alias,
			[...objectNode.fields, primaryField],
			{
				where: {
					[targetEntity.primary]: { in: inversedIds },
				},
			}
		)
		const result = await this.mapper.select(targetEntity, queryWithWhere)

		return this.buildManyHasManyGroups(targetEntity, joiningColumns, result, junctionValues)
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
		this.dataCallback(
			entity.primary,
			(async () => {
				const ids = await this.parentIdsGetter(entity.primary)
				const idsWhere: Input.Where = {
					[targetRelation.name]: {
						[entity.primary]: {
							in: ids,
						},
					},
				}
				const where: Input.Where = {
					and: [idsWhere, this.object.args.where].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = this.object.withArg('where', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetRelation.name)
			})(),
			null
		)
	}

	public visitOneHasOneOwner(
		entity: Model.Entity,
		relation: Model.OneHasOneOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneInversedRelation | null
	): void {
		this.dataCallback(
			entity.primary,
			(async () => {
				const ids = await this.parentIdsGetter(relation.name)
				const idsWhere: Input.Where = {
					[targetEntity.primary]: {
						in: ids,
					},
				}
				const where: Input.Where = {
					and: [idsWhere, this.object.args.where].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = this.object.withArg('where', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetEntity.primary)
			})(),
			null
		)
	}

	public visitManyHasOne(
		entity: Model.Entity,
		relation: Model.ManyHasOneRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasManyRelation | null
	): void {
		this.dataCallback(
			relation.name,
			(async () => {
				const ids = await this.parentIdsGetter(relation.name)
				const idsWhere: Input.Where = {
					[targetEntity.primary]: {
						in: ids,
					},
				}
				const where: Input.Where = {
					and: [idsWhere, this.object.args.where].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = this.object.withArg('where', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetEntity.primary)
			})(),
			null
		)
	}
}

namespace RelationFetchVisitor {
	export type DataCallback = (
		parentKey: string,
		data: Promise<SelectHydrator.NestedData>,
		defaultValue: SelectHydrator.NestedDefaultValue
	) => void
}

export default RelationFetchVisitor
