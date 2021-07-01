import { Input, Model } from '@contember/schema'
import { GroupedCounts, JoiningColumns, Mapper, RelationFetcher } from '../../mapper'
import { ObjectNode } from '../../inputProcessing'

export class PaginatedHasManyCountVisitor
	implements Model.ColumnVisitor<Promise<GroupedCounts>>, Model.RelationByTypeVisitor<Promise<GroupedCounts>>
{
	constructor(
		private readonly ids: Input.PrimaryValue[],
		private readonly objectNode: ObjectNode<Input.PaginationQueryInput>,
		private readonly relationFetcher: RelationFetcher,
		private readonly mapper: Mapper,
	) {}

	async visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation,
	): Promise<GroupedCounts> {
		return await this.relationFetcher.countOneHasManyGroups(
			this.mapper,
			this.objectNode.args.filter,
			targetEntity,
			targetRelation,
			this.ids,
		)
	}

	async visitManyHasManyOwning(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyInverseRelation | null,
	): Promise<GroupedCounts> {
		const joiningTable = relation.joiningTable
		const columns: JoiningColumns = {
			sourceColumn: joiningTable.joiningColumn,
			targetColumn: joiningTable.inverseJoiningColumn,
		}
		return await this.relationFetcher.countManyHasManyGroups(
			this.mapper,
			this.objectNode.args.filter,
			targetEntity,
			relation,
			this.ids,
			columns,
		)
	}

	async visitManyHasManyInverse(
		entity: Model.Entity,
		relation: Model.ManyHasManyInverseRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyOwningRelation,
	): Promise<GroupedCounts> {
		const joiningTable = targetRelation.joiningTable
		const columns: JoiningColumns = {
			targetColumn: joiningTable.joiningColumn,
			sourceColumn: joiningTable.inverseJoiningColumn,
		}
		return await this.relationFetcher.countManyHasManyGroups(
			this.mapper,
			this.objectNode.args.filter,
			targetEntity,
			targetRelation,
			this.ids,
			columns,
		)
	}

	visitColumn(): never {
		throw new Error()
	}

	visitManyHasOne(): never {
		throw new Error()
	}

	visitOneHasOneInverse(): never {
		throw new Error()
	}

	visitOneHasOneOwning(): never {
		throw new Error()
	}
}
