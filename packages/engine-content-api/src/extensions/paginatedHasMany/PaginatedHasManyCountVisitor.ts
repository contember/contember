import { Input, Model } from '@contember/schema'
import { GroupedCounts, Mapper, RelationFetcher } from '../../mapper'
import { ObjectNode } from '../../inputProcessing'

export class PaginatedHasManyCountVisitor implements
	Model.ColumnVisitor<Promise<GroupedCounts>>,
	Model.RelationByTypeVisitor<Promise<GroupedCounts>> {

	constructor(
		private readonly ids: Input.PrimaryValue[],
		private readonly objectNode: ObjectNode<Input.PaginationQueryInput>,
		private readonly relationFetcher: RelationFetcher,
		private readonly mapper: Mapper,
		private readonly relationPath: Model.AnyRelationContext[],
	) {}

	async visitOneHasMany(relationContext: Model.OneHasManyContext): Promise<GroupedCounts> {
		return await this.relationFetcher.countOneHasManyGroups(
			{
				mapper: this.mapper,
				filter: this.objectNode.args.filter,
				relationContext,
				relationPath: this.relationPath,
				ids: this.ids,
			},
		)
	}

	async visitManyHasManyOwning(relationContext: Model.ManyHasManyOwningContext): Promise<GroupedCounts> {
		return await this.relationFetcher.countManyHasManyGroups(
			{
				mapper: this.mapper,
				filter: this.objectNode.args.filter,
				relationContext,
				relationPath: this.relationPath,
				ids: this.ids,
			},
		)
	}

	async visitManyHasManyInverse(relationContext: Model.ManyHasManyInverseContext): Promise<GroupedCounts> {
		return await this.relationFetcher.countManyHasManyGroups(
			{
				mapper: this.mapper,
				filter: this.objectNode.args.filter,
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
