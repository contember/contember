import { Input, Model } from 'cms-common'
import ObjectNode from '../../graphQlResolver/ObjectNode'
import SelectHydrator from './SelectHydrator'
import Mapper from '../mapper'
import FieldNode from '../../graphQlResolver/FieldNode'

type JoiningColumns = { sourceColumn: Model.JoiningColumn; targetColumn: Model.JoiningColumn }

export default class HasManyFetchVisitor
	implements Model.RelationByTypeVisitor<PromiseLike<SelectHydrator.GroupedObjects> | never> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly mapper: Mapper,
		private readonly parentIds: PromiseLike<Input.PrimaryValue[]>,
		private readonly object: ObjectNode<Input.ListQueryInput>
	) {}

	public async visitManyHasManyInversed(
		entity: Model.Entity,
		relation: Model.ManyHasManyInversedRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyOwnerRelation
	): Promise<SelectHydrator.GroupedObjects> {
		const joiningTable = targetRelation.joiningTable
		const columns: JoiningColumns = {
			sourceColumn: joiningTable.inverseJoiningColumn,
			targetColumn: joiningTable.joiningColumn
		}
		return this.getManyHasManyGroups(targetEntity, targetRelation, columns, this.object, await this.parentIds)
	}

	public async visitManyHasManyOwner(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyInversedRelation | null
	): Promise<SelectHydrator.GroupedObjects> {
		const joiningTable = relation.joiningTable
		const columns: JoiningColumns = {
			sourceColumn: joiningTable.joiningColumn,
			targetColumn: joiningTable.inverseJoiningColumn
		}
		return this.getManyHasManyGroups(targetEntity, relation, columns, this.object, await this.parentIds)
	}

	public async visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation
	): Promise<SelectHydrator.GroupedObjects> {
		const whereWithParentId = {
			...this.object.args.where,
			[targetRelation.name]: { [entity.primary]: { in: await this.parentIds } }
		}
		const objectNode = new ObjectNode<Input.ListQueryInput>(this.object.name, this.object.alias, this.object.fields, {
			...this.object.args,
			where: whereWithParentId
		})

		return this.mapper.selectGrouped(targetEntity, objectNode, targetRelation.joiningColumn.columnName)
	}

	private async getManyHasManyGroups(
		targetEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		joiningColumns: JoiningColumns,
		objectNode: ObjectNode<Input.ListQueryInput>,
		ids: Input.PrimaryValue[]
	) {
		const junctionValues = await this.mapper.fetchJunction(relation, ids, joiningColumns.sourceColumn)

		const primaryField = new FieldNode(targetEntity.primary, targetEntity.primary)
		const inversedJoiningColumn = joiningColumns.targetColumn.columnName
		const inversedIds = junctionValues
			.map((it: any) => it[inversedJoiningColumn])
			.filter((it, index, arr) => arr.indexOf(it) === index)

		const result = await this.mapper.select(
			targetEntity,
			new ObjectNode<Input.ListQueryInput>(objectNode.name, objectNode.alias, [...objectNode.fields, primaryField], {
				...objectNode.args,
				where: {
					...objectNode.args.where,
					[targetEntity.primary]: { in: inversedIds }
				}
			})
		)

		return this.buildManyHasManyGroups(targetEntity, joiningColumns, result, junctionValues)
	}

	private buildManyHasManyGroups(
		entity: Model.Entity,
		joiningColumns: JoiningColumns,
		resultObjects: SelectHydrator.ResultObjects,
		junctionValues: SelectHydrator.Rows
	) {
		const dataById: { [id: string]: SelectHydrator.ResultObject } = {}
		for (let object of resultObjects) {
			dataById[object[entity.primary]] = object
		}
		const groupedResult: { [id: string]: SelectHydrator.ResultObjects } = {}
		const sourceColumn = joiningColumns.sourceColumn.columnName
		const targetColumn = joiningColumns.targetColumn.columnName

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

	public visitOneHasOneInversed(): never {
		throw new Error()
	}

	public visitOneHasOneOwner(): never {
		throw new Error()
	}

	public visitManyHasOne(): never {
		throw new Error()
	}
}
