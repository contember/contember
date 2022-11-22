import { Model } from '@contember/schema'
import { WhereTypeProvider } from '../WhereTypeProvider'
import { GraphQLFieldConfigArgumentMap, GraphQLInt, GraphQLList, GraphQLNonNull } from 'graphql'
import { OrderByTypeProvider } from '../OrderByTypeProvider'

export class FieldArgsVisitor implements
	Model.ColumnVisitor<GraphQLFieldConfigArgumentMap | undefined>,
	Model.RelationByGenericTypeVisitor<GraphQLFieldConfigArgumentMap | undefined> {

	constructor(
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly orderByTypeProvider: OrderByTypeProvider,
	) {
		this.whereTypeProvider = whereTypeProvider
	}

	public visitColumn() {
		return undefined
	}

	public visitHasMany({ relation }: Model.AnyHasManyRelationContext) {
		const filter = this.getWhereArg(relation)
		const orderBy = this.getOrderByArgs(relation)
		return {
			filter,
			orderBy,
			offset: { type: GraphQLInt },
			limit: { type: GraphQLInt },
		}
	}

	public visitHasOne({ relation }: Model.ManyHasOneContext) {
		const filter = this.getWhereArg(relation)
		return { filter }
	}

	private getWhereArg(relation: Model.Relation) {
		return { type: this.whereTypeProvider.getEntityWhereType(relation.target) }
	}

	private getOrderByArgs(relation: Model.Relation) {
		return {
			type: new GraphQLList(new GraphQLNonNull(this.orderByTypeProvider.getEntityOrderByType(relation.target))),
		}
	}
}
