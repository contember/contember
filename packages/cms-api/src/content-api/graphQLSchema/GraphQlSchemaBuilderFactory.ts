import { Acl, Model } from 'cms-common'
import EntityTypeProvider from './EntityTypeProvider'
import ColumnTypeResolver from './ColumnTypeResolver'
import EnumsProvider from './EnumsProvider'
import QueryProvider from './QueryProvider'
import MutationProvider from './MutationProvider'
import WhereTypeProvider from './WhereTypeProvider'
import ConditionTypeProvider from './ConditionTypeProvider'
import GraphQlSchemaBuilder from './GraphQlSchemaBuilder'
import StaticAuthorizator from '../../acl/StaticAuthorizator'
import CreateEntityInputFieldVisitor from './mutations/CreateEntityInputFieldVisitor'
import CreateEntityRelationInputProvider from './mutations/CreateEntityRelationInputProvider'
import CreateEntityRelationInputFieldVisitor from './mutations/CreateEntityRelationInputFieldVisitor'
import { Accessor } from '../../utils/accessor'
import UpdateEntityRelationInputFieldVisitor from './mutations/UpdateEntityRelationInputFieldVisitor'
import UpdateEntityRelationInputProvider from './mutations/UpdateEntityRelationInputProvider'
import UpdateEntityInputFieldVisitor from './mutations/UpdateEntityInputFieldVisitor'
import EntityInputProvider from './mutations/EntityInputProvider'
import ExecutionContainerFactory from '../graphQlResolver/ExecutionContainerFactory'
import ReadResolverFactory from '../graphQlResolver/ReadResolverFactory'
import GraphQlQueryAstFactory from '../graphQlResolver/GraphQlQueryAstFactory'
import MutationResolverFactory from '../graphQlResolver/MutationResolverFactory'
import UpdateEntityRelationAllowedOperationsVisitor from './mutations/UpdateEntityRelationAllowedOperationsVisitor'
import CreateEntityRelationAllowedOperationsVisitor from './mutations/CreateEntityRelationAllowedOperationsVisitor'
import OrderByTypeProvider from './OrderByTypeProvider'
import HasManyToHasOneReducer from '../extensions/hasManyToHasOneReducer/HasManyToHasOneReducer'
import HasManyToHasOneRelationReducerFieldVisitor from '../extensions/hasManyToHasOneReducer/HasManyToHasOneRelationReducerVisitor'

export default class GraphQlSchemaBuilderFactory {
	public create(schema: Model.Schema, permissions: Acl.Permissions): GraphQlSchemaBuilder {
		const authorizator = new StaticAuthorizator(permissions)
		const columnTypeResolver = new ColumnTypeResolver(schema, new EnumsProvider(schema))
		const conditionTypeProvider = new ConditionTypeProvider(columnTypeResolver)
		const whereTypeProvider = new WhereTypeProvider(schema, authorizator, columnTypeResolver, conditionTypeProvider)
		const orderByTypeProvider = new OrderByTypeProvider(schema, authorizator)
		const entityTypeProviderAccessor = new Accessor<EntityTypeProvider>()
		const hasManyToOneReducerVisitor = new HasManyToHasOneRelationReducerFieldVisitor(
			schema,
			authorizator,
			entityTypeProviderAccessor,
			whereTypeProvider
		)
		const hasManyToOneReducer = new HasManyToHasOneReducer(schema, hasManyToOneReducerVisitor)

		const entityTypeProvider = new EntityTypeProvider(
			schema,
			authorizator,
			columnTypeResolver,
			whereTypeProvider,
			orderByTypeProvider,
			{
				[HasManyToHasOneReducer.extensionName]: hasManyToOneReducer,
			}
		)
		entityTypeProviderAccessor.set(entityTypeProvider)

		const executionContainerFactory = new ExecutionContainerFactory(schema, permissions)
		const readResolverFactory = new ReadResolverFactory(executionContainerFactory)
		const queryAstFactory = new GraphQlQueryAstFactory()
		const queryProvider = new QueryProvider(
			schema,
			authorizator,
			whereTypeProvider,
			orderByTypeProvider,
			entityTypeProvider,
			queryAstFactory,
			readResolverFactory
		)

		const createEntityInputProviderAccessor = new Accessor<EntityInputProvider<EntityInputProvider.Type.create>>()
		const createEntityRelationAllowedOperationsVisitor = new CreateEntityRelationAllowedOperationsVisitor(authorizator)
		const createEntityRelationInputFieldVisitor = new CreateEntityRelationInputFieldVisitor(
			schema,
			whereTypeProvider,
			createEntityInputProviderAccessor,
			createEntityRelationAllowedOperationsVisitor
		)
		const createEntityRelationInputProvider = new CreateEntityRelationInputProvider(
			schema,
			createEntityRelationInputFieldVisitor
		)
		const createEntityInputFieldVisitor = new CreateEntityInputFieldVisitor(
			schema,
			authorizator,
			columnTypeResolver,
			createEntityRelationInputProvider
		)
		const createEntityInputProvider = new EntityInputProvider(
			EntityInputProvider.Type.create,
			schema,
			authorizator,
			createEntityInputFieldVisitor
		)
		createEntityInputProviderAccessor.set(createEntityInputProvider)

		const updateEntityInputProviderAccessor = new Accessor<EntityInputProvider<EntityInputProvider.Type.update>>()
		const updateEntityRelationAllowedOperationsVisitor = new UpdateEntityRelationAllowedOperationsVisitor(authorizator)
		const updateEntityRelationInputFieldVisitor = new UpdateEntityRelationInputFieldVisitor(
			schema,
			whereTypeProvider,
			updateEntityInputProviderAccessor,
			createEntityInputProvider,
			updateEntityRelationAllowedOperationsVisitor
		)
		const updateEntityRelationInputProvider = new UpdateEntityRelationInputProvider(
			schema,
			updateEntityRelationInputFieldVisitor
		)
		const updateEntityInputFieldVisitor = new UpdateEntityInputFieldVisitor(
			authorizator,
			columnTypeResolver,
			updateEntityRelationInputProvider
		)
		const updateEntityInputProvider = new EntityInputProvider(
			EntityInputProvider.Type.update,
			schema,
			authorizator,
			updateEntityInputFieldVisitor
		)
		updateEntityInputProviderAccessor.set(updateEntityInputProvider)

		const mutationResolverFactory = new MutationResolverFactory(executionContainerFactory)
		const mutationProvider = new MutationProvider(
			schema,
			authorizator,
			whereTypeProvider,
			entityTypeProvider,
			columnTypeResolver,
			createEntityInputProvider,
			updateEntityInputProvider,
			queryAstFactory,
			mutationResolverFactory
		)

		return new GraphQlSchemaBuilder(schema, queryProvider, mutationProvider)
	}
}
