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
import ReadResolver from '../graphQlResolver/ReadResolver'
import Authorizator from '../../acl/Authorizator'
import MutationResolver from '../graphQlResolver/MutationResolver'
import VariableInjector from '../../acl/VariableInjector'
import PredicatesInjector from '../../acl/PredicatesInjector'
import UniqueWhereExpander from '../graphQlResolver/UniqueWhereExpander'
import PredicateFactory from "../../acl/PredicateFactory";
import MapperRunner from "../sql/MapperRunner";

export default class GraphQlSchemaBuilderFactory {
	public create(schema: Model.Schema, permissions: Acl.Permissions): GraphQlSchemaBuilder {
		const authorizator = new StaticAuthorizator(permissions)
		const columnTypeResolver = new ColumnTypeResolver(schema, new EnumsProvider(schema))
		const conditionTypeProvider = new ConditionTypeProvider(columnTypeResolver)
		const whereTypeProvider = new WhereTypeProvider(schema, authorizator, columnTypeResolver, conditionTypeProvider)
		const entityTypeProvider = new EntityTypeProvider(schema, authorizator, columnTypeResolver, whereTypeProvider)
		const variableInjector = new VariableInjector()
		const predicatesFactory = new PredicateFactory(permissions, variableInjector)
		const predicatesInjector = new PredicatesInjector(schema, predicatesFactory)
		const uniqueWhereExpander = new UniqueWhereExpander(schema)
		const mapperRunner = new MapperRunner(schema, predicatesFactory)
		const readResolver = new ReadResolver(mapperRunner, predicatesInjector, uniqueWhereExpander)
		const queryProvider = new QueryProvider(schema, authorizator, whereTypeProvider, entityTypeProvider, readResolver)

		const createEntityInputProviderAccessor = new Accessor<EntityInputProvider<Authorizator.Operation.create>>()
		const createEntityRelationInputFieldVisitor = new CreateEntityRelationInputFieldVisitor(
			authorizator,
			whereTypeProvider,
			createEntityInputProviderAccessor
		)
		const createEntityRelationInputProvider = new CreateEntityRelationInputProvider(
			schema,
			createEntityRelationInputFieldVisitor
		)
		const createEntityInputFieldVisitor = new CreateEntityInputFieldVisitor(
			columnTypeResolver,
			createEntityRelationInputProvider
		)
		const createEntityInputProvider = new EntityInputProvider(
			Authorizator.Operation.create,
			schema,
			authorizator,
			createEntityInputFieldVisitor
		)
		createEntityInputProviderAccessor.set(createEntityInputProvider)

		const updateEntityInputProviderAccessor = new Accessor<EntityInputProvider<Authorizator.Operation.update>>()
		const updateEntityRelationInputFieldVisitor = new UpdateEntityRelationInputFieldVisitor(
			authorizator,
			whereTypeProvider,
			updateEntityInputProviderAccessor,
			createEntityInputProvider
		)
		const updateEntityRelationInputProvider = new UpdateEntityRelationInputProvider(
			schema,
			updateEntityRelationInputFieldVisitor
		)
		const updateEntityInputFieldVisitor = new UpdateEntityInputFieldVisitor(
			columnTypeResolver,
			updateEntityRelationInputProvider
		)
		const updateEntityInputProvider = new EntityInputProvider(
			Authorizator.Operation.update,
			schema,
			authorizator,
			updateEntityInputFieldVisitor
		)
		updateEntityInputProviderAccessor.set(updateEntityInputProvider)

		const mutationResolver = new MutationResolver(mapperRunner, uniqueWhereExpander)
		const mutationProvider = new MutationProvider(
			schema,
			authorizator,
			whereTypeProvider,
			entityTypeProvider,
			columnTypeResolver,
			createEntityInputProvider,
			updateEntityInputProvider,
			mutationResolver
		)

		return new GraphQlSchemaBuilder(schema, queryProvider, mutationProvider)
	}
}
