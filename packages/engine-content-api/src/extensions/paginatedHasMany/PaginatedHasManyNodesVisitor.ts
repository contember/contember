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
	) {}

	async visitOneHasMany({ targetEntity, relation, targetRelation }: Model.OneHasManyContext) {
		return await this.relationFetcher.fetchOneHasManyGroups(
			{
				mapper: this.mapper,
				objectNode: this.objectNode,
				targetEntity: targetEntity,
				relation: relation,
				targetRelation: targetRelation,
				ids: this.ids,
			},
		)
	}

	async visitManyHasManyOwning({ targetEntity, relation, targetRelation }: Model.ManyHasManyOwningContext) {
		return await this.relationFetcher.fetchManyHasManyGroups(
			{
				mapper: this.mapper,
				field: this.objectNode,
				targetEntity: targetEntity,
				sourceRelation: relation,
				targetRelation,
				directionFrom: 'owning',
				ids: this.ids,
			},
		)
	}

	async visitManyHasManyInverse({ targetEntity, targetRelation, relation }: Model.ManyHasManyInverseContext) {
		return await this.relationFetcher.fetchManyHasManyGroups(
			{
				mapper: this.mapper,
				field: this.objectNode,
				targetEntity: targetEntity,
				sourceRelation: relation,
				targetRelation,
				directionFrom: 'inverse',
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
