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
	) {}

	async visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation,
	): Promise<GroupedCounts> {
		return await this.relationFetcher.countOneHasManyGroups(
			{
				mapper: this.mapper,
				filter: this.objectNode.args.filter,
				targetEntity: targetEntity,
				targetRelation: targetRelation,
				ids: this.ids,
			},
		)
	}

	async visitManyHasManyOwning(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyInverseRelation | null,
	): Promise<GroupedCounts> {
		return await this.relationFetcher.countManyHasManyGroups(
			{
				mapper: this.mapper,
				filter: this.objectNode.args.filter,
				targetEntity: targetEntity,
				sourceRelation: relation,
				targetRelation,
				directionFrom: 'owning',
				ids: this.ids,
			},
		)
	}

	async visitManyHasManyInverse(
		entity: Model.Entity,
		relation: Model.ManyHasManyInverseRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyOwningRelation,
	): Promise<GroupedCounts> {
		return await this.relationFetcher.countManyHasManyGroups(
			{
				mapper: this.mapper,
				filter: this.objectNode.args.filter,
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
