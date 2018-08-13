import { GraphQLFieldConfigMap, GraphQLObjectType, GraphQLSchema } from 'graphql'
import { Model } from 'cms-common'
import ColumnTypeResolver from './ColumnTypeResolver'
import ConditionTypeProvider from './ConditionTypeProvider'
import EntityTypeProvider from './EntityTypeProvider'
import EnumsProvider from './EnumsProvider'
import MutationProvider from './MutationProvider'
import QueryProvider from './QueryProvider'
import WhereTypeProvider from './WhereTypeProvider'
import ReadResolver from '../graphQlResolver/ReadResolver'

export default class GraphQlSchemaBuilder {
	private schema: Model.Schema
	private columnTypeResolver: ColumnTypeResolver
	private conditionTypeProvider: ConditionTypeProvider
	private whereTypeProvider: WhereTypeProvider
	private entityTypeProvider: EntityTypeProvider
	private queryProvider: QueryProvider
	private mutationProvider: MutationProvider

	constructor(schema: Model.Schema) {
		this.schema = schema
		this.columnTypeResolver = new ColumnTypeResolver(schema, new EnumsProvider(schema))
		this.conditionTypeProvider = new ConditionTypeProvider(this.columnTypeResolver)
		this.whereTypeProvider = new WhereTypeProvider(this.schema, this.columnTypeResolver, this.conditionTypeProvider)
		this.entityTypeProvider = new EntityTypeProvider(this.schema, this.columnTypeResolver, this.whereTypeProvider)
		const readResolver = new ReadResolver(schema)
		this.queryProvider = new QueryProvider(this.schema, this.whereTypeProvider, this.entityTypeProvider, readResolver)
		this.mutationProvider = new MutationProvider(
			this.schema,
			this.whereTypeProvider,
			this.entityTypeProvider,
			this.columnTypeResolver,
			readResolver
		)
	}

	public build() {
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
			mutation: new GraphQLObjectType({
				name: 'Mutation',
				fields: () =>
					Object.keys(this.schema.entities).reduce<GraphQLFieldConfigMap<any, any>>((mutations, entityName) => {
						return {
							...this.mutationProvider.getMutations(entityName),
							...mutations
						}
					}, {})
			})
		})
	}
}
