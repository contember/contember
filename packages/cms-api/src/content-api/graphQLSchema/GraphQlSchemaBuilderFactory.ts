import EntityTypeProvider from './EntityTypeProvider'
import ColumnTypeResolver from './ColumnTypeResolver'
import EnumsProvider from './EnumsProvider'
import QueryProvider from './QueryProvider'
import MutationProvider from './MutationProvider'
import WhereTypeProvider from './WhereTypeProvider'
import ConditionTypeProvider from './ConditionTypeProvider'
import GraphQlSchemaBuilder from './GraphQlSchemaBuilder'
import { Model } from 'cms-common'
import ReadResolver from '../graphQlResolver/ReadResolver'
import MutationResolver from '../graphQlResolver/MutationResolver'

export default class GraphQlSchemaBuilderFactory {
	public create(schema: Model.Schema): GraphQlSchemaBuilder {
		const columnTypeResolver = new ColumnTypeResolver(schema, new EnumsProvider(schema))
		const conditionTypeProvider = new ConditionTypeProvider(columnTypeResolver)
		const whereTypeProvider = new WhereTypeProvider(schema, columnTypeResolver, conditionTypeProvider)
		const entityTypeProvider = new EntityTypeProvider(schema, columnTypeResolver, whereTypeProvider)
		const readResolver = new ReadResolver(schema)
		const queryProvider = new QueryProvider(schema, whereTypeProvider, entityTypeProvider, readResolver)
		const mutationResolver = new MutationResolver(schema)
		const mutationProvider = new MutationProvider(
			schema,
			whereTypeProvider,
			entityTypeProvider,
			columnTypeResolver,
			mutationResolver
		)

		return new GraphQlSchemaBuilder(schema, queryProvider, mutationProvider)
	}
}
