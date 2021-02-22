import { Model } from '@contember/schema'
import { EntityTypeProvider } from './EntityTypeProvider'
import { ColumnTypeResolver } from './ColumnTypeResolver'
import { EnumsProvider } from './EnumsProvider'
import { QueryProvider } from './QueryProvider'
import { MutationProvider } from './MutationProvider'
import { WhereTypeProvider } from './WhereTypeProvider'
import { ConditionTypeProvider } from './ConditionTypeProvider'
import { GraphQlSchemaBuilder } from './GraphQlSchemaBuilder'
import { CreateEntityInputFieldVisitor, EntityInputType } from './mutations'
import { CreateEntityRelationInputProvider } from './mutations'
import { CreateEntityRelationInputFieldVisitor } from './mutations'
import { Accessor } from '../utils'
import { UpdateEntityRelationInputFieldVisitor } from './mutations'
import { UpdateEntityRelationInputProvider } from './mutations'
import { UpdateEntityInputFieldVisitor } from './mutations'
import { EntityInputProvider } from './mutations'
import { UpdateEntityRelationAllowedOperationsVisitor } from './mutations'
import { CreateEntityRelationAllowedOperationsVisitor } from './mutations'
import { OrderByTypeProvider } from './OrderByTypeProvider'
import { HasManyToHasOneReducer } from '../extensions'
import { HasManyToHasOneRelationReducerFieldVisitor } from '../extensions'
import { ValidationQueriesProvider } from './ValidationQueriesProvider'
import { CustomTypesProvider } from './CustomTypesProvider'
import { ResultSchemaTypeProvider } from './ResultSchemaTypeProvider'
import { Authorizator } from '../acl'
import { PaginatedFieldConfigFactory } from './PaginatedFieldConfigFactory'
import { PaginatedHasManyFieldProvider } from '../extensions/paginatedHasMany/PaginatedHasManyFieldProvider'
import { PaginatedHasManyFieldProviderVisitor } from '../extensions/paginatedHasMany/PaginatedHasManyFieldProviderVisitor'

export class GraphQlSchemaBuilderFactory {
	constructor() {}

	public create(schema: Model.Schema, authorizator: Authorizator): GraphQlSchemaBuilder {
		const customTypesProvider = new CustomTypesProvider()
		const enumsProvider = new EnumsProvider(schema)
		const columnTypeResolver = new ColumnTypeResolver(schema, enumsProvider, customTypesProvider)
		const conditionTypeProvider = new ConditionTypeProvider(columnTypeResolver)
		const whereTypeProvider = new WhereTypeProvider(schema, authorizator, columnTypeResolver, conditionTypeProvider)
		const orderByTypeProvider = new OrderByTypeProvider(schema, authorizator)

		const entityTypeProvider = new EntityTypeProvider(
			schema,
			authorizator,
			columnTypeResolver,
			whereTypeProvider,
			orderByTypeProvider,
		)

		const paginatedFieldConfigFactory = new PaginatedFieldConfigFactory(
			whereTypeProvider,
			orderByTypeProvider,
			entityTypeProvider,
		)
		const hasManyToOneReducerVisitor = new HasManyToHasOneRelationReducerFieldVisitor(
			schema,
			authorizator,
			entityTypeProvider,
			whereTypeProvider,
		)
		const hasManyToOneReducer = new HasManyToHasOneReducer(schema, hasManyToOneReducerVisitor)
		entityTypeProvider.registerEntityFieldProvider(HasManyToHasOneReducer.extensionName, hasManyToOneReducer)

		const paginatedHasManyFieldProviderVisitor = new PaginatedHasManyFieldProviderVisitor(paginatedFieldConfigFactory)
		const paginatedHasManyFieldProvider = new PaginatedHasManyFieldProvider(
			schema,
			paginatedHasManyFieldProviderVisitor,
		)
		entityTypeProvider.registerEntityFieldProvider(
			PaginatedHasManyFieldProvider.extensionName,
			paginatedHasManyFieldProvider,
		)

		const queryProvider = new QueryProvider(
			authorizator,
			whereTypeProvider,
			orderByTypeProvider,
			entityTypeProvider,
			paginatedFieldConfigFactory,
		)

		const createEntityInputProviderAccessor = new Accessor<EntityInputProvider<EntityInputType.create>>()
		const createEntityRelationAllowedOperationsVisitor = new CreateEntityRelationAllowedOperationsVisitor(authorizator)
		const createEntityRelationInputFieldVisitor = new CreateEntityRelationInputFieldVisitor(
			schema,
			whereTypeProvider,
			createEntityInputProviderAccessor,
			createEntityRelationAllowedOperationsVisitor,
		)
		const createEntityRelationInputProvider = new CreateEntityRelationInputProvider(
			schema,
			createEntityRelationInputFieldVisitor,
		)
		const createEntityInputFieldVisitor = new CreateEntityInputFieldVisitor(
			schema,
			authorizator,
			columnTypeResolver,
			createEntityRelationInputProvider,
		)
		const createEntityInputProvider = new EntityInputProvider(
			EntityInputType.create,
			schema,
			authorizator,
			createEntityInputFieldVisitor,
		)
		createEntityInputProviderAccessor.set(createEntityInputProvider)

		const updateEntityInputProviderAccessor = new Accessor<EntityInputProvider<EntityInputType.update>>()
		const updateEntityRelationAllowedOperationsVisitor = new UpdateEntityRelationAllowedOperationsVisitor(authorizator)
		const updateEntityRelationInputFieldVisitor = new UpdateEntityRelationInputFieldVisitor(
			schema,
			authorizator,
			whereTypeProvider,
			updateEntityInputProviderAccessor,
			createEntityInputProvider,
			updateEntityRelationAllowedOperationsVisitor,
		)
		const updateEntityRelationInputProvider = new UpdateEntityRelationInputProvider(
			schema,
			updateEntityRelationInputFieldVisitor,
		)
		const updateEntityInputFieldVisitor = new UpdateEntityInputFieldVisitor(
			authorizator,
			columnTypeResolver,
			updateEntityRelationInputProvider,
		)
		const updateEntityInputProvider = new EntityInputProvider(
			EntityInputType.update,
			schema,
			authorizator,
			updateEntityInputFieldVisitor,
		)
		updateEntityInputProviderAccessor.set(updateEntityInputProvider)

		const resultSchemaTypeProvider = new ResultSchemaTypeProvider()
		const mutationProvider = new MutationProvider(
			authorizator,
			whereTypeProvider,
			entityTypeProvider,
			createEntityInputProvider,
			updateEntityInputProvider,
			resultSchemaTypeProvider,
		)
		const validationQueriesProvider = new ValidationQueriesProvider(
			whereTypeProvider,
			createEntityInputProvider,
			updateEntityInputProvider,
			resultSchemaTypeProvider,
		)

		return new GraphQlSchemaBuilder(
			schema,
			queryProvider,
			validationQueriesProvider,
			mutationProvider,
			resultSchemaTypeProvider,
		)
	}
}
