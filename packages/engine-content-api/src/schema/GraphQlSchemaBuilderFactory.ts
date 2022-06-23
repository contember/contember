import { Model } from '@contember/schema'
import { EntityTypeProvider } from './EntityTypeProvider.js'
import { ColumnTypeResolver } from './ColumnTypeResolver.js'
import { EnumsProvider } from './EnumsProvider.js'
import { QueryProvider } from './QueryProvider.js'
import { MutationProvider } from './MutationProvider.js'
import { WhereTypeProvider } from './WhereTypeProvider.js'
import { ConditionTypeProvider } from './ConditionTypeProvider.js'
import { GraphQlSchemaBuilder } from './GraphQlSchemaBuilder.js'
import { CreateEntityInputFieldVisitor, EntityInputType, CreateEntityRelationInputProvider, CreateEntityRelationInputFieldVisitor, UpdateEntityRelationInputFieldVisitor, UpdateEntityRelationInputProvider, UpdateEntityInputFieldVisitor, EntityInputProvider, UpdateEntityRelationAllowedOperationsVisitor, CreateEntityRelationAllowedOperationsVisitor } from './mutations/index.js'
import { Accessor } from '../utils/index.js'
import { OrderByTypeProvider } from './OrderByTypeProvider.js'
import { HasManyToHasOneReducer, HasManyToHasOneRelationReducerFieldVisitor } from '../extensions/index.js'
import { ValidationQueriesProvider } from './ValidationQueriesProvider.js'
import { CustomTypesProvider } from './CustomTypesProvider.js'
import { ResultSchemaTypeProvider } from './ResultSchemaTypeProvider.js'
import { Authorizator } from '../acl/index.js'
import { PaginatedFieldConfigFactory } from './PaginatedFieldConfigFactory.js'
import { PaginatedHasManyFieldProvider } from '../extensions/paginatedHasMany/PaginatedHasManyFieldProvider.js'
import { PaginatedHasManyFieldProviderVisitor } from '../extensions/paginatedHasMany/PaginatedHasManyFieldProviderVisitor.js'
import { Builder } from '@contember/dic'

export class GraphQlSchemaBuilderFactory {
	constructor() {}

	public create(schema: Model.Schema, authorizator: Authorizator): GraphQlSchemaBuilder {
		return this.createContainerBuilder(schema, authorizator).build().graphQlSchemaBuilder
	}

	public createContainerBuilder(schema: Model.Schema, authorizator: Authorizator) {
		return new Builder({})
			.addService('schema', () =>
				schema)
			.addService('authorizator', () =>
				authorizator)
			.addService('customTypesProvider', ({}) =>
				new CustomTypesProvider())
			.addService('enumsProvider', ({ schema }) =>
				new EnumsProvider(schema))
			.addService('columnTypeResolver', ({ schema, enumsProvider, customTypesProvider }) =>
				new ColumnTypeResolver(schema, enumsProvider, customTypesProvider))
			.addService('conditionTypeProvider', ({ columnTypeResolver }) =>
				new ConditionTypeProvider(columnTypeResolver))
			.addService('whereTypeProvider', ({ schema, authorizator, columnTypeResolver, conditionTypeProvider }) =>
				new WhereTypeProvider(schema, authorizator, columnTypeResolver, conditionTypeProvider))
			.addService('orderByTypeProvider', ({ schema, authorizator }) =>
				new OrderByTypeProvider(schema, authorizator))
			.addService('entityTypeProvider', ({ schema, authorizator, columnTypeResolver, whereTypeProvider, orderByTypeProvider }) =>
				new EntityTypeProvider(schema, authorizator, columnTypeResolver, whereTypeProvider, orderByTypeProvider))
			.addService('paginatedFieldConfigFactory', ({ whereTypeProvider, orderByTypeProvider, entityTypeProvider }) =>
				new PaginatedFieldConfigFactory(whereTypeProvider, orderByTypeProvider, entityTypeProvider))
			.addService('hasManyToOneReducerVisitor', ({ schema, authorizator, entityTypeProvider, whereTypeProvider }) =>
				new HasManyToHasOneRelationReducerFieldVisitor(schema, authorizator, entityTypeProvider, whereTypeProvider))
			.addService('hasManyToOneReducer', ({ schema, hasManyToOneReducerVisitor }) =>
				new HasManyToHasOneReducer(schema, hasManyToOneReducerVisitor))
			.addService('paginatedHasManyFieldProviderVisitor', ({ paginatedFieldConfigFactory }) =>
				new PaginatedHasManyFieldProviderVisitor(paginatedFieldConfigFactory))
			.addService('paginatedHasManyFieldProvider', ({ schema, paginatedHasManyFieldProviderVisitor }) =>
				new PaginatedHasManyFieldProvider(schema, paginatedHasManyFieldProviderVisitor))
			.addService('queryProvider', ({ authorizator, whereTypeProvider, orderByTypeProvider, entityTypeProvider, paginatedFieldConfigFactory }) =>
				new QueryProvider(authorizator, whereTypeProvider, orderByTypeProvider, entityTypeProvider, paginatedFieldConfigFactory))
			.addService('createEntityInputProviderAccessor', ({}) =>
				new Accessor<EntityInputProvider<EntityInputType.create>>())
			.addService('createEntityRelationAllowedOperationsVisitor', ({ authorizator }) =>
				new CreateEntityRelationAllowedOperationsVisitor(authorizator))
			.addService('createEntityRelationInputFieldVisitor', ({ schema,					whereTypeProvider,					createEntityInputProviderAccessor,					createEntityRelationAllowedOperationsVisitor				}) =>
				new CreateEntityRelationInputFieldVisitor(schema, whereTypeProvider, createEntityInputProviderAccessor, createEntityRelationAllowedOperationsVisitor))
			.addService('createEntityRelationInputProvider', ({ schema, createEntityRelationInputFieldVisitor }) =>
				new CreateEntityRelationInputProvider(schema, createEntityRelationInputFieldVisitor))
			.addService('createEntityInputFieldVisitor', ({ schema, authorizator, columnTypeResolver, createEntityRelationInputProvider }) =>
				new CreateEntityInputFieldVisitor(schema, authorizator, columnTypeResolver, createEntityRelationInputProvider))
			.addService('createEntityInputProvider', ({ schema, authorizator, createEntityInputFieldVisitor }) =>
				new EntityInputProvider(EntityInputType.create, schema, authorizator, createEntityInputFieldVisitor))
			.addService('updateEntityInputProviderAccessor', ({}) =>
				new Accessor<EntityInputProvider<EntityInputType.update>>())
			.addService('updateEntityRelationAllowedOperationsVisitor', ({ authorizator }) =>
				new UpdateEntityRelationAllowedOperationsVisitor(authorizator))
			.addService('updateEntityRelationInputFieldVisitor', ({ schema, authorizator, whereTypeProvider, updateEntityInputProviderAccessor, createEntityInputProvider, updateEntityRelationAllowedOperationsVisitor }) =>
				new UpdateEntityRelationInputFieldVisitor(schema, authorizator, whereTypeProvider, updateEntityInputProviderAccessor, createEntityInputProvider, updateEntityRelationAllowedOperationsVisitor))
			.addService('updateEntityRelationInputProvider', ({ schema, updateEntityRelationInputFieldVisitor }) =>
				new UpdateEntityRelationInputProvider(schema, updateEntityRelationInputFieldVisitor))
			.addService('updateEntityInputFieldVisitor', ({ authorizator, columnTypeResolver, updateEntityRelationInputProvider }) =>
				new UpdateEntityInputFieldVisitor(authorizator, columnTypeResolver, updateEntityRelationInputProvider))
			.addService('updateEntityInputProvider', ({ schema, authorizator, updateEntityInputFieldVisitor }) =>
				new EntityInputProvider(EntityInputType.update, schema, authorizator, updateEntityInputFieldVisitor))
			.addService('resultSchemaTypeProvider', ({}) =>
				new ResultSchemaTypeProvider())
			.addService('mutationProvider', ({ authorizator, whereTypeProvider, entityTypeProvider, createEntityInputProvider, updateEntityInputProvider, resultSchemaTypeProvider }) =>
				new MutationProvider(authorizator, whereTypeProvider, entityTypeProvider, createEntityInputProvider, updateEntityInputProvider, resultSchemaTypeProvider))
			.addService('validationQueriesProvider', ({ whereTypeProvider, createEntityInputProvider, updateEntityInputProvider, resultSchemaTypeProvider }) =>
				new ValidationQueriesProvider(whereTypeProvider, createEntityInputProvider, updateEntityInputProvider, resultSchemaTypeProvider))
			.addService('graphQlSchemaBuilder', ({ schema, queryProvider, validationQueriesProvider, mutationProvider, resultSchemaTypeProvider }) =>
				new GraphQlSchemaBuilder(schema, queryProvider, validationQueriesProvider, mutationProvider, resultSchemaTypeProvider))
			.setupService('createEntityInputProvider', (it, { createEntityInputProviderAccessor }) => {
				createEntityInputProviderAccessor.set(it)
			})
			.setupService('updateEntityInputProvider', (it, { updateEntityInputProviderAccessor }) => {
				updateEntityInputProviderAccessor.set(it)
			})
			.setupService('entityTypeProvider', (it, { hasManyToOneReducer }) => {
				it.registerEntityFieldProvider(HasManyToHasOneReducer.extensionName, hasManyToOneReducer)
			})
			.setupService('entityTypeProvider', (it, { paginatedHasManyFieldProvider }) => {
				it.registerEntityFieldProvider(PaginatedHasManyFieldProvider.extensionName, paginatedHasManyFieldProvider)
			})
	}
}
