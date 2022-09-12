import { Input, Model } from '@contember/schema'
import { Mapper, RelationFetcher, SelectGroupedObjects } from '../../mapper'
import { ObjectNode } from '../../inputProcessing'

export class PaginatedHasManyNodesVisitor implements
	Model.ColumnVisitor<Promise<SelectGroupedObjects>>,
	Model.RelationByTypeVisitor<Promise<SelectGroupedObjects>> {

	constructor(
		private readonly ids: Input.PrimaryValue[],
		private readonly objectNode: ObjectNode<Input.PaginationQueryInput>,
		private readonly relationFetcher: RelationFetcher,
		private readonly mapper: Mapper,
		private readonly relationPath: Model.AnyRelationContext[],
	) {}

	async visitOneHasMany(relationContext: Model.OneHasManyContext) {
		return await this.relationFetcher.fetchOneHasManyGroups(
			{
				mapper: this.mapper,
				objectNode: this.objectNode,
				relationContext,
				relationPath: this.relationPath,
				ids: this.ids,
			},
		)
	}

	async visitManyHasManyOwning(relationContext: Model.ManyHasManyOwningContext) {
		return await this.relationFetcher.fetchManyHasManyGroups(
			{
				mapper: this.mapper,
				field: this.objectNode,
				relationContext,
				relationPath: this.relationPath,
				ids: this.ids,
			},
		)
	}

	async visitManyHasManyInverse(relationContext: Model.ManyHasManyInverseContext) {
		return await this.relationFetcher.fetchManyHasManyGroups(
			{
				mapper: this.mapper,
				field: this.objectNode,
				relationContext,
				relationPath: this.relationPath,
				ids: this.ids,
			},
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
