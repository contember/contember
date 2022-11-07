import { PredicateFactory, PredicatesInjector, VariableInjector } from '../acl'
import {
	ConditionBuilder,
	FieldsVisitorFactory,
	JoinBuilder,
	MetaHandler,
	OrderByBuilder,
	RelationFetcher,
	WhereBuilder,
} from './select'
import { UniqueWhereExpander } from '../inputProcessing'
import { HasManyToHasOneReducer, HasManyToHasOneReducerExecutionHandler } from '../extensions'
import {
	DeleteExecutor,
	InsertBuilderFactory,
	Inserter,
	JunctionConnectHandler,
	JunctionDisconnectHandler,
	JunctionTableManager,
	Mapper,
	MapperFactory,
	PathFactory,
	SelectBuilder,
	SelectBuilderFactory,
	SelectHydrator,
	UpdateBuilderFactory,
	Updater,
} from '../mapper'
import { Builder } from '@contember/dic'
import { Acl, Model, Schema } from '@contember/schema'
import { Client, SelectBuilder as DbSelectBuilder } from '@contember/database'
import { Providers } from '@contember/schema-utils'
import { PaginatedHasManyExecutionHandler } from '../extensions/paginatedHasMany/PaginatedHasManyExecutionHandler'
import { PaginatedHasManyFieldProvider } from '../extensions/paginatedHasMany/PaginatedHasManyFieldProvider'
import { WhereOptimizer } from './select/optimizer/WhereOptimizer'
import { ConditionOptimizer } from './select/optimizer/ConditionOptimizer'

type MapperContainerArgs = {
	schema: Schema
	identityVariables: Acl.VariablesMap
	permissions: Acl.Permissions
	providers: Providers
}

export interface MapperContainer {
	mapperFactory: MapperFactory
}

export const createMapperContainer = ({ permissions, schema, identityVariables, providers }: MapperContainerArgs) => {
	const builder = new Builder({})
		.addService('providers', () =>
			providers)
		.addService('variableInjector', () =>
			new VariableInjector(schema.model, identityVariables))
		.addService('predicateFactory', ({ variableInjector }) =>
			new PredicateFactory(permissions, schema.model, variableInjector))
		.addService('predicatesInjector', ({ predicateFactory }) =>
			new PredicatesInjector(schema.model, predicateFactory))
		.addService('joinBuilder', () =>
			new JoinBuilder(schema.model))
		.addService('conditionBuilder', () =>
			new ConditionBuilder())
		.addService('pathFactory', () =>
			new PathFactory())
		.addService('whereOptimized', () =>
			new WhereOptimizer(schema.model, new ConditionOptimizer()))
		.addService('whereBuilder', ({ joinBuilder, conditionBuilder, pathFactory, whereOptimized }) =>
			new WhereBuilder(schema.model, joinBuilder, conditionBuilder, pathFactory, whereOptimized, schema.settings.useExistsInHasManyFilter === true))
		.addService('orderByBuilder', ({ joinBuilder }) =>
			new OrderByBuilder(schema.model, joinBuilder))
		.addService('relationFetcher', ({ whereBuilder, orderByBuilder, predicatesInjector, pathFactory }) =>
			new RelationFetcher(whereBuilder, orderByBuilder, predicatesInjector, pathFactory))
		.addService('fieldsVisitorFactory', ({ relationFetcher, predicateFactory, whereBuilder }) =>
			new FieldsVisitorFactory(schema.model, relationFetcher, predicateFactory, whereBuilder))
		.addService('metaHandler', ({ whereBuilder, predicateFactory }) =>
			new MetaHandler(whereBuilder, predicateFactory))
		.addService('uniqueWhereExpander', () =>
			new UniqueWhereExpander(schema.model))
		.addService('hasManyToHasOneReducer', ({ uniqueWhereExpander }) =>
			new HasManyToHasOneReducerExecutionHandler(schema.model, uniqueWhereExpander))
		.addService('paginatedHasManyExecutionHandler', ({ relationFetcher }) =>
			new PaginatedHasManyExecutionHandler(schema.model, relationFetcher))
		.addService('selectHandlers', ({ hasManyToHasOneReducer, paginatedHasManyExecutionHandler }) => ({
			[HasManyToHasOneReducer.extensionName]: hasManyToHasOneReducer,
			[PaginatedHasManyFieldProvider.extensionName]: paginatedHasManyExecutionHandler,
		}))
		.addService('selectBuilderFactory', ({ whereBuilder, orderByBuilder, fieldsVisitorFactory, metaHandler, selectHandlers, pathFactory, predicateFactory }) =>
			new (class implements SelectBuilderFactory {
				create(qb: DbSelectBuilder, hydrator: SelectHydrator, relationPath: Model.AnyRelationContext[]): SelectBuilder {
					return new SelectBuilder(
						schema.model,
						whereBuilder,
						orderByBuilder,
						metaHandler,
						qb,
						hydrator,
						fieldsVisitorFactory,
						selectHandlers,
						pathFactory,
						relationPath,
						predicateFactory,
					)
				}
			})())
		.addService('insertBuilderFactory', ({ whereBuilder, pathFactory }) =>
			new InsertBuilderFactory(schema.model, whereBuilder, pathFactory))
		.addService('updateBuilderFactory', ({ whereBuilder, pathFactory }) =>
			new UpdateBuilderFactory(schema.model, whereBuilder, pathFactory))
		.addService('connectJunctionHandler', () =>
			new JunctionConnectHandler())
		.addService('disconnectJunctionHandler', ({}) =>
			new JunctionDisconnectHandler())
		.addService('junctionTableManager', ({ predicateFactory, whereBuilder, connectJunctionHandler, disconnectJunctionHandler, pathFactory }) =>
			new JunctionTableManager(schema.model, predicateFactory, whereBuilder, connectJunctionHandler, disconnectJunctionHandler, pathFactory))
		.addService('deleteExecutor', ({ predicateFactory, updateBuilderFactory, whereBuilder, pathFactory }) =>
			new DeleteExecutor(schema.model, predicateFactory, whereBuilder, updateBuilderFactory, pathFactory))
		.addService('updater', ({ predicateFactory, updateBuilderFactory }) =>
			new Updater(schema.model, predicateFactory, updateBuilderFactory))
		.addService('inserter', ({ predicateFactory, insertBuilderFactory, providers }) =>
			new Inserter(schema.model, predicateFactory, insertBuilderFactory, providers))
		.addService('mapperFactory', ({ predicatesInjector, selectBuilderFactory, uniqueWhereExpander, whereBuilder, junctionTableManager, deleteExecutor, updater, inserter, pathFactory }) => {
			return (db: Client) =>
				new Mapper(
					schema.model,
					db,
					predicatesInjector,
					selectBuilderFactory,
					uniqueWhereExpander,
					whereBuilder,
					junctionTableManager,
					deleteExecutor,
					updater,
					inserter,
					pathFactory,
				)
		})
	return builder.build().pick('mapperFactory')
}
