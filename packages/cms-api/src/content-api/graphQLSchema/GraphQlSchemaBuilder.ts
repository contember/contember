import { GraphQLFieldConfigMap, GraphQLObjectType, GraphQLSchema } from 'graphql'
import { Model } from 'cms-common'
import MutationProvider from './MutationProvider'
import QueryProvider from './QueryProvider'

export default class GraphQlSchemaBuilder {
	constructor(
		private schema: Model.Schema,
		private queryProvider: QueryProvider,
		private mutationProvider: MutationProvider
	) {}

	public build() {
		const mutations = Object.keys(this.schema.entities).reduce<GraphQLFieldConfigMap<any, any>>(
			(mutations, entityName) => {
				return {
					...this.mutationProvider.getMutations(entityName),
					...mutations
				}
			},
			{}
		)

		return new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: () =>
					Object.keys(this.schema.entities).reduce<GraphQLFieldConfigMap<any, any>>((queries, entityName) => {
						return {
							...this.queryProvider.getQueries(entityName),
							...queries
						}
					}, {})
			}),
			...(Object.keys(mutations).length > 0
				? {
						mutation: new GraphQLObjectType({
							name: 'Mutation',
							fields: () => mutations
						})
				  }
				: {})
		})
	}
}
