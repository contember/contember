import { Builder, Container } from '@contember/dic'
import { Acl, Schema } from '@contember/schema'
import JoinBuilder from '../sql/select/JoinBuilder'
import ConditionBuilder from '../sql/select/ConditionBuilder'
import WhereBuilder from '../sql/select/WhereBuilder'
import SelectBuilderFactory from '../sql/select/SelectBuilderFactory'
import InsertBuilderFactory from '../sql/insert/InsertBuilderFactory'
import UpdateBuilderFactory from '../sql/update/UpdateBuilderFactory'
import { Context } from '../types'
import PredicatesInjector from '../acl/PredicatesInjector'
import VariableInjector from '../acl/VariableInjector'
import PredicateFactory from '../acl/PredicateFactory'
import UniqueWhereExpander from './UniqueWhereExpander'
import ReadResolver from './ReadResolver'
import MutationResolver from './MutationResolver'
import JunctionTableManager from '../sql/JunctionTableManager'
import OrderByBuilder from '../sql/select/OrderByBuilder'
import JunctionFetcher from '../sql/select/JunctionFetcher'
import Mapper from '../sql/Mapper'
import FieldsVisitorFactory from '../sql/select/handlers/FieldsVisitorFactory'
import { Client, SelectBuilder as DbSelectBuilder } from '@contember/database'
import SelectHydrator from '../sql/select/SelectHydrator'
import SelectBuilder from '../sql/select/SelectBuilder'
import MetaHandler from '../sql/select/handlers/MetaHandler'
import HasManyToHasOneReducerExecutionHandler from '../extensions/hasManyToHasOneReducer/HasManyToHasOneReducerExecutionHandler'
import HasManyToHasOneReducer from '../extensions/hasManyToHasOneReducer/HasManyToHasOneReducer'
import DeleteExecutor from '../sql/delete/DeleteExecutor'
import DependencyCollector from '../input-validation/dependencies/DependencyCollector'
import QueryAstFactory from '../input-validation/QueryAstFactory'
import ValidationDataSelector from '../input-validation/ValidationDataSelector'
import ValidationResolver from './ValidationResolver'
import { Providers } from '@contember/schema-utils'
import GraphQlQueryAstFactory from './GraphQlQueryAstFactory'
import { getArgumentValues } from 'graphql/execution/values'
import { Updater } from '../sql/update/Updater'
import { Inserter } from '../sql/insert/Inserter'
import { ColumnValueResolver } from '../input-validation/ColumnValueResolver'
import { EntityRulesResolver } from '../input-validation/EntityRulesResolver'
import { InputPreValidator } from '../input-validation/preValidation/InputPreValidator'

export interface ExecutionContainer {
	readResolver: ReadResolver
	mutationResolver: MutationResolver
	validationResolver: ValidationResolver
}

export class ExecutionContainerFactory {
	constructor(
		private readonly schema: Schema,
		private readonly permissions: Acl.Permissions,
		private readonly providers: Providers,
		private readonly argumentValuesResolver: typeof getArgumentValues,
		private readonly setupSystemVariables: (db: Client) => Promise<void>,
	) {}

	public create(context: Pick<Context, 'db' | 'identityVariables'>): Container<ExecutionContainer> {
		const that = this
		const innerDic = new Builder({})
			.addService('db', () => context.db)
			.addService('providers', () => this.providers)
			.addService('variableInjector', () => new VariableInjector(this.schema.model, context.identityVariables))
			.addService(
				'predicateFactory',
				({ variableInjector }) => new PredicateFactory(this.permissions, variableInjector),
			)
			.addService(
				'predicatesInjector',
				({ predicateFactory }) => new PredicatesInjector(this.schema.model, predicateFactory),
			)
			.addService('joinBuilder', () => new JoinBuilder(this.schema.model))
			.addService('conditionBuilder', () => new ConditionBuilder())
			.addService(
				'whereBuilder',
				({ joinBuilder, conditionBuilder }) => new WhereBuilder(this.schema.model, joinBuilder, conditionBuilder),
			)
			.addService('orderByBuilder', ({ joinBuilder }) => new OrderByBuilder(this.schema.model, joinBuilder))
			.addService(
				'junctionFetcher',
				({ whereBuilder, orderByBuilder, predicatesInjector }) =>
					new JunctionFetcher(whereBuilder, orderByBuilder, predicatesInjector),
			)
			.addService(
				'fieldsVisitorFactory',
				({ junctionFetcher, predicateFactory, whereBuilder }) =>
					new FieldsVisitorFactory(this.schema.model, junctionFetcher, predicateFactory, whereBuilder),
			)
			.addService(
				'metaHandler',
				({ whereBuilder, predicateFactory }) => new MetaHandler(whereBuilder, predicateFactory),
			)
			.addService('uniqueWhereExpander', () => new UniqueWhereExpander(this.schema.model))
			.addService(
				'hasManyToHasOneReducer',
				({ uniqueWhereExpander }) => new HasManyToHasOneReducerExecutionHandler(this.schema.model, uniqueWhereExpander),
			)
			.addService('selectHandlers', ({ hasManyToHasOneReducer }) => ({
				[HasManyToHasOneReducer.extensionName]: hasManyToHasOneReducer,
			}))
			.addService(
				'selectBuilderFactory',
				({ whereBuilder, orderByBuilder, fieldsVisitorFactory, metaHandler, selectHandlers }) =>
					new (class implements SelectBuilderFactory {
						create(qb: DbSelectBuilder, hydrator: SelectHydrator): SelectBuilder {
							return new SelectBuilder(
								that.schema.model,
								whereBuilder,
								orderByBuilder,
								metaHandler,
								qb,
								hydrator,
								fieldsVisitorFactory,
								selectHandlers,
							)
						}
					})(),
			)
			.addService(
				'insertBuilderFactory',
				({ whereBuilder }) => new InsertBuilderFactory(this.schema.model, whereBuilder),
			)
			.addService(
				'updateBuilderFactory',
				({ whereBuilder }) => new UpdateBuilderFactory(this.schema.model, whereBuilder),
			)

			.addService(
				'connectJunctionHandler',
				({ providers }) => new JunctionTableManager.JunctionConnectHandler(providers),
			)
			.addService('disconnectJunctionHandler', ({}) => new JunctionTableManager.JunctionDisconnectHandler())
			.addService(
				'junctionTableManager',
				({ predicateFactory, whereBuilder, connectJunctionHandler, disconnectJunctionHandler }) =>
					new JunctionTableManager(
						this.schema.model,
						predicateFactory,
						whereBuilder,
						connectJunctionHandler,
						disconnectJunctionHandler,
					),
			)
			.addService(
				'deleteExecutor',
				({ predicateFactory, updateBuilderFactory, whereBuilder }) =>
					new DeleteExecutor(this.schema.model, predicateFactory, whereBuilder, updateBuilderFactory),
			)
			.addService(
				'updater',
				({ predicateFactory, updateBuilderFactory, uniqueWhereExpander }) =>
					new Updater(this.schema.model, predicateFactory, updateBuilderFactory, uniqueWhereExpander),
			)
			.addService(
				'inserter',
				({ predicateFactory, insertBuilderFactory, providers }) =>
					new Inserter(this.schema.model, predicateFactory, insertBuilderFactory, providers),
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
				}) => {
					return (db: Client) =>
						new Mapper(
							this.schema.model,
							db,
							predicatesInjector,
							selectBuilderFactory,
							uniqueWhereExpander,
							whereBuilder,
							junctionTableManager,
							deleteExecutor,
							updater,
							inserter,
						)
				},
			)
			.addService('queryAstFactory', () => new GraphQlQueryAstFactory(this.argumentValuesResolver))
			.addService(
				'readResolver',
				({ db, mapperFactory, queryAstFactory }) => new ReadResolver(db, mapperFactory, queryAstFactory),
			)
			.addService('validationDependencyCollector', () => new DependencyCollector())
			.addService('validationQueryAstFactory', () => new QueryAstFactory(this.schema.model))
			.addService(
				'dataSelector',
				({ validationQueryAstFactory }) => new ValidationDataSelector(this.schema.model, validationQueryAstFactory),
			)
			.addService('columnValueResolver', ({ providers }) => new ColumnValueResolver(providers))
			.addService('entityRulesResolver', () => new EntityRulesResolver(this.schema.validation, this.schema.model))
			.addService(
				'inputPreValidator',
				({ entityRulesResolver, columnValueResolver, dataSelector }) =>
					new InputPreValidator(this.schema.model, entityRulesResolver, columnValueResolver, dataSelector),
			)
			.addService(
				'mutationResolver',
				({ db, mapperFactory, inputPreValidator, queryAstFactory }) =>
					new MutationResolver(db, mapperFactory, this.setupSystemVariables, inputPreValidator, queryAstFactory),
			)
			.addService(
				'validationResolver',
				({ inputPreValidator, db, mapperFactory }) => new ValidationResolver(db, mapperFactory, inputPreValidator),
			)

			.build()

		return innerDic.pick('readResolver', 'mutationResolver', 'validationResolver')
	}
}
