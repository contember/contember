import VariableInjector from '../acl/VariableInjector'
import PredicateFactory from '../acl/PredicateFactory'
import PredicatesInjector from '../acl/PredicatesInjector'
import JoinBuilder from '../sql/select/JoinBuilder'
import ConditionBuilder from '../sql/select/ConditionBuilder'
import WhereBuilder from '../sql/select/WhereBuilder'
import OrderByBuilder from '../sql/select/OrderByBuilder'
import JunctionFetcher from '../sql/select/JunctionFetcher'
import FieldsVisitorFactory from '../sql/select/handlers/FieldsVisitorFactory'
import MetaHandler from '../sql/select/handlers/MetaHandler'
import { UniqueWhereExpander } from './UniqueWhereExpander'
import HasManyToHasOneReducerExecutionHandler from '../extensions/hasManyToHasOneReducer/HasManyToHasOneReducerExecutionHandler'
import HasManyToHasOneReducer from '../extensions/hasManyToHasOneReducer/HasManyToHasOneReducer'
import SelectBuilderFactory from '../sql/select/SelectBuilderFactory'
import SelectHydrator from '../sql/select/SelectHydrator'
import SelectBuilder from '../sql/select/SelectBuilder'
import InsertBuilderFactory from '../sql/insert/InsertBuilderFactory'
import UpdateBuilderFactory from '../sql/update/UpdateBuilderFactory'
import JunctionTableManager from '../sql/JunctionTableManager'
import { DeleteExecutor } from '../sql/delete'
import { Updater } from '../sql/update/Updater'
import { Inserter } from '../sql/insert/Inserter'
import Mapper from '../sql/Mapper'
import { Builder } from '@contember/dic'
import { Acl, Schema } from '@contember/schema'
import { Client, SelectBuilder as DbSelectBuilder } from '@contember/database'
import { Providers } from '@contember/schema-utils'
import { PathFactory } from '../sql/select/Path'

type MapperContainerArgs = {
	schema: Schema
	identityVariables: Acl.VariablesMap
	permissions: Acl.Permissions
	providers: Providers
}

export interface MapperContainer {
	mapperFactory: Mapper.Factory
}

export const createMapperContainer = ({ permissions, schema, identityVariables, providers }: MapperContainerArgs) => {
	const builder = new Builder({})
		.addService('providers', () => providers)
		.addService('variableInjector', () => new VariableInjector(schema.model, identityVariables))
		.addService('predicateFactory', ({ variableInjector }) => new PredicateFactory(permissions, variableInjector))
		.addService('predicatesInjector', ({ predicateFactory }) => new PredicatesInjector(schema.model, predicateFactory))
		.addService('joinBuilder', () => new JoinBuilder(schema.model))
		.addService('conditionBuilder', () => new ConditionBuilder())
		.addService('pathFactory', () => new PathFactory())
		.addService(
			'whereBuilder',
			({ joinBuilder, conditionBuilder, pathFactory }) =>
				new WhereBuilder(schema.model, joinBuilder, conditionBuilder, pathFactory),
		)
		.addService('orderByBuilder', ({ joinBuilder }) => new OrderByBuilder(schema.model, joinBuilder))
		.addService(
			'junctionFetcher',
			({ whereBuilder, orderByBuilder, predicatesInjector, pathFactory }) =>
				new JunctionFetcher(whereBuilder, orderByBuilder, predicatesInjector, pathFactory),
		)
		.addService(
			'fieldsVisitorFactory',
			({ junctionFetcher, predicateFactory, whereBuilder }) =>
				new FieldsVisitorFactory(schema.model, junctionFetcher, predicateFactory, whereBuilder),
		)
		.addService('metaHandler', ({ whereBuilder, predicateFactory }) => new MetaHandler(whereBuilder, predicateFactory))
		.addService('uniqueWhereExpander', () => new UniqueWhereExpander(schema.model))
		.addService(
			'hasManyToHasOneReducer',
			({ uniqueWhereExpander }) => new HasManyToHasOneReducerExecutionHandler(schema.model, uniqueWhereExpander),
		)
		.addService('selectHandlers', ({ hasManyToHasOneReducer }) => ({
			[HasManyToHasOneReducer.extensionName]: hasManyToHasOneReducer,
		}))
		.addService(
			'selectBuilderFactory',
			({ whereBuilder, orderByBuilder, fieldsVisitorFactory, metaHandler, selectHandlers, pathFactory }) =>
				new (class implements SelectBuilderFactory {
					create(qb: DbSelectBuilder, hydrator: SelectHydrator): SelectBuilder {
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
						)
					}
				})(),
		)
		.addService(
			'insertBuilderFactory',
			({ whereBuilder, pathFactory }) => new InsertBuilderFactory(schema.model, whereBuilder, pathFactory),
		)
		.addService(
			'updateBuilderFactory',
			({ whereBuilder, pathFactory }) => new UpdateBuilderFactory(schema.model, whereBuilder, pathFactory),
		)

		.addService('connectJunctionHandler', () => new JunctionTableManager.JunctionConnectHandler())
		.addService('disconnectJunctionHandler', ({}) => new JunctionTableManager.JunctionDisconnectHandler())
		.addService(
			'junctionTableManager',
			({ predicateFactory, whereBuilder, connectJunctionHandler, disconnectJunctionHandler, pathFactory }) =>
				new JunctionTableManager(
					schema.model,
					predicateFactory,
					whereBuilder,
					connectJunctionHandler,
					disconnectJunctionHandler,
					pathFactory,
				),
		)
		.addService(
			'deleteExecutor',
			({ predicateFactory, updateBuilderFactory, whereBuilder, pathFactory }) =>
				new DeleteExecutor(schema.model, predicateFactory, whereBuilder, updateBuilderFactory, pathFactory),
		)
		.addService(
			'updater',
			({ predicateFactory, updateBuilderFactory, uniqueWhereExpander }) =>
				new Updater(schema.model, predicateFactory, updateBuilderFactory, uniqueWhereExpander),
		)
		.addService(
			'inserter',
			({ predicateFactory, insertBuilderFactory, providers }) =>
				new Inserter(schema.model, predicateFactory, insertBuilderFactory, providers),
		)

		.addService(
			'mapperFactory',
			({
				predicatesInjector,
				selectBuilderFactory,
				uniqueWhereExpander,
				whereBuilder,
				junctionTableManager,
				deleteExecutor,
				updater,
				inserter,
				pathFactory,
			}) => {
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
			},
		)
	return builder.build().pick('mapperFactory')
}
