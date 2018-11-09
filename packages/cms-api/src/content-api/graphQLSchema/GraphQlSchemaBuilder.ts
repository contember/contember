import { GraphQLFieldConfigMap, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql'
import { Model } from 'cms-common'
import MutationProvider from './MutationProvider'
import QueryProvider from './QueryProvider'
import S3 from '../../utils/S3'
import { GraphQLFieldConfig } from 'graphql/type/definition'

export default class GraphQlSchemaBuilder {
	constructor(
		private schema: Model.Schema,
		private queryProvider: QueryProvider,
		private mutationProvider: MutationProvider,
		private s3: S3
	) {}

	public build() {
		const mutations = {
			...Object.keys(this.schema.entities).reduce<GraphQLFieldConfigMap<any, any>>((mutations, entityName) => {
				return {
					...this.mutationProvider.getMutations(entityName),
					...mutations,
				}
			}, {}),
			generateUploadUrl: {
				type: new GraphQLNonNull(
					new GraphQLObjectType({
						name: 'SignedUpload',
						fields: {
							url: { type: new GraphQLNonNull(GraphQLString) },
							objectKey: { type: new GraphQLNonNull(GraphQLString) },
							bucket: { type: new GraphQLNonNull(GraphQLString) },
							region: { type: new GraphQLNonNull(GraphQLString) },
							publicUrl: { type: new GraphQLNonNull(GraphQLString) },
						},
					})
				),
				args: {
					contentType: { type: new GraphQLNonNull(GraphQLString) },
				},
				resolve: async (parent, args: { contentType: string }) => {
					return this.s3.getSignedUrl(args.contentType)
				},
			} as GraphQLFieldConfig<any, any, any>,
		}

		const queries = Object.keys(this.schema.entities).reduce<GraphQLFieldConfigMap<any, any>>((queries, entityName) => {
			return {
				...this.queryProvider.getQueries(entityName),
				...queries,
			}
		}, {})

		queries['_info'] = {
			type: new GraphQLObjectType({
				name: 'Info',
				fields: () => ({
					description: { type: GraphQLString },
				}),
			}),
			resolve: () => ({
				description: 'TODO',
			}),
		}

		return new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: () => queries,
			}),
			...(Object.keys(mutations).length > 0
				? {
						mutation: new GraphQLObjectType({
							name: 'Mutation',
							fields: () => mutations,
						}),
				  }
				: {}),
		})
	}
}
