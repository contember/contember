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
