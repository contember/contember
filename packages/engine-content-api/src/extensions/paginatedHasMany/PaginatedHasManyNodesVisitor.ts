import { Input, Model } from '@contember/schema'
import { GroupedCounts, JoiningColumns, Mapper, RelationFetcher, SelectGroupedObjects } from '../../mapper'
import { ObjectNode } from '../../inputProcessing'

export class PaginatedHasManyNodesVisitor implements
	Model.ColumnVisitor<Promise<SelectGroupedObjects>>,
	Model.RelationByTypeVisitor<Promise<SelectGroupedObjects>> {

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
	): Promise<SelectGroupedObjects> {
		return await this.relationFetcher.fetchOneHasManyGroups(
			this.mapper,
			this.objectNode,
			targetEntity,
			relation,
			targetRelation,
			this.ids,
		)
	}

	async visitManyHasManyOwning(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyInverseRelation | null,
	): Promise<SelectGroupedObjects> {
		const joiningTable = relation.joiningTable
		const columns: JoiningColumns = {
			sourceColumn: joiningTable.joiningColumn,
			targetColumn: joiningTable.inverseJoiningColumn,
		}
		return await this.relationFetcher.fetchManyHasManyGroups(
			this.mapper,
			this.objectNode,
			targetEntity,
			relation,
			relation,
			columns,
			this.ids,
		)
	}

	async visitManyHasManyInverse(
		entity: Model.Entity,
		relation: Model.ManyHasManyInverseRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyOwningRelation,
	): Promise<SelectGroupedObjects> {
		const joiningTable = targetRelation.joiningTable
		const columns: JoiningColumns = {
			targetColumn: joiningTable.joiningColumn,
			sourceColumn: joiningTable.inverseJoiningColumn,
		}
		return await this.relationFetcher.fetchManyHasManyGroups(
			this.mapper,
			this.objectNode,
			targetEntity,
			relation,
			targetRelation,
			columns,
			this.ids,
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
