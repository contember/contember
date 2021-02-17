import { Model } from '@contember/schema'
import { WhereTypeProvider } from './WhereTypeProvider'
import { OrderByTypeProvider } from './OrderByTypeProvider'
import { EntityTypeProvider } from './EntityTypeProvider'
import { GraphQLObjectsFactory } from '@contember/graphql-utils'
import { GraphQLFieldConfig } from 'graphql'

export class PaginatedFieldConfigFactory {
	constructor(
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly orderByTypeProvider: OrderByTypeProvider,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly graphqlObjectFactories: GraphQLObjectsFactory,
	) {}

	createFieldConfig(entity: Model.Entity): GraphQLFieldConfig<any, any> {
		const entityName = entity.name
		return {
			type: this.graphqlObjectFactories.createNotNull(this.entityTypeProvider.getConnection(entityName)),

			args: {
				filter: { type: this.whereTypeProvider.getEntityWhereType(entityName) },
				orderBy: {
					type: this.graphqlObjectFactories.createList(
						this.graphqlObjectFactories.createNotNull(this.orderByTypeProvider.getEntityOrderByType(entityName)),
					),
				},
				skip: { type: this.graphqlObjectFactories.int },
				first: { type: this.graphqlObjectFactories.int },
			},
		}
	}
}
