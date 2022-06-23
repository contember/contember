import { Model } from '@contember/schema'
import { WhereTypeProvider } from './WhereTypeProvider.js'
import { OrderByTypeProvider } from './OrderByTypeProvider.js'
import { EntityTypeProvider } from './EntityTypeProvider.js'
import { GraphQLFieldConfig, GraphQLInt, GraphQLList, GraphQLNonNull } from 'graphql'

export class PaginatedFieldConfigFactory {
	constructor(
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly orderByTypeProvider: OrderByTypeProvider,
		private readonly entityTypeProvider: EntityTypeProvider,
	) {}

	createFieldConfig(entity: Model.Entity): GraphQLFieldConfig<any, any> {
		const entityName = entity.name
		return {
			type: new GraphQLNonNull(this.entityTypeProvider.getConnection(entityName)),

			args: {
				filter: { type: this.whereTypeProvider.getEntityWhereType(entityName) },
				orderBy: {
					type: new GraphQLList(new GraphQLNonNull(this.orderByTypeProvider.getEntityOrderByType(entityName))),
				},
				skip: { type: GraphQLInt },
				first: { type: GraphQLInt },
			},
		}
	}
}
