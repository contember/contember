import { Container, Builder } from '@contember/dic'
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
import { Accessor } from '../utils/accessor'
import FieldsVisitorFactory from '../sql/select/handlers/FieldsVisitorFactory'
import { SelectBuilder as DbSelectBuilder } from '@contember/database'
import SelectHydrator from '../sql/select/SelectHydrator'
import SelectBuilder from '../sql/select/SelectBuilder'
import MetaHandler from '../sql/select/handlers/MetaHandler'
import HasManyToHasOneReducerExecutionHandler from '../extensions/hasManyToHasOneReducer/HasManyToHasOneReducerExecutionHandler'
import HasManyToHasOneReducer from '../extensions/hasManyToHasOneReducer/HasManyToHasOneReducer'
import DeleteExecutor from '../sql/delete/DeleteExecutor'
import InputValidator from '../input-validation/InputValidator'
import DependencyCollector from '../input-validation/DependencyCollector'
import QueryAstFactory from '../input-validation/QueryAstFactory'
import ValidationContextFactory from '../input-validation/ValidationContextFactory'
import ValidationDataSelector from '../input-validation/ValidationDataSelector'
import ValidationResolver from './ValidationResolver'
import DependencyPruner from '../input-validation/DependencyPruner'
import { Providers } from '@contember/schema-utils'
import GraphQlQueryAstFactory from './GraphQlQueryAstFactory'
import { getArgumentValues } from 'graphql/execution/values'

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
				({ whereBuilder, orderByBuilder, predicatesInjector, db }) =>
					new JunctionFetcher(db, whereBuilder, orderByBuilder, predicatesInjector),
			)
			.addService('mapperAccessor', () => new Accessor<Mapper>())
			.addService(
				'fieldsVisitorFactory',
				({ junctionFetcher, mapperAccessor, predicateFactory, whereBuilder }) =>
					new FieldsVisitorFactory(this.schema.model, junctionFetcher, mapperAccessor, predicateFactory, whereBuilder),
			)
			.addService(
				'metaHandler',
				({ whereBuilder, predicateFactory }) => new MetaHandler(whereBuilder, predicateFactory),
			)
			.addService('uniqueWhereExpander', () => new UniqueWhereExpander(this.schema.model))
			.addService(
				'hasManyToHasOneReducer',
				({ mapperAccessor, uniqueWhereExpander }) =>
					new HasManyToHasOneReducerExecutionHandler(this.schema.model, mapperAccessor, uniqueWhereExpander),
			)
			.addService('selectHandlers', ({ hasManyToHasOneReducer }) => ({
				[HasManyToHasOneReducer.extensionName]: hasManyToHasOneReducer,
			}))
			.addService(
				'selectBuilderFactory',
				({ whereBuilder, orderByBuilder, fieldsVisitorFactory, metaHandler, selectHandlers, db }) =>
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
								db,
							)
						}
					})(),
			)
			.addService(
				'insertBuilderFactory',
				({ whereBuilder, db }) => new InsertBuilderFactory(this.schema.model, whereBuilder, db),
			)
			.addService(
				'updateBuilderFactory',
				({ whereBuilder, db }) => new UpdateBuilderFactory(this.schema.model, whereBuilder, db),
			)

			.addService(
				'connectJunctionHandler',
				({ db, providers }) => new JunctionTableManager.JunctionConnectHandler(db, providers),
			)
			.addService(
				'disconnectJunctionHandler',
				({ db, providers }) => new JunctionTableManager.JunctionDisconnectHandler(db),
			)
			.addService(
				'junctionTableManager',
				({ uniqueWhereExpander, predicateFactory, whereBuilder, connectJunctionHandler, disconnectJunctionHandler }) =>
					new JunctionTableManager(
						this.schema.model,
						predicateFactory,
						uniqueWhereExpander,
						whereBuilder,
						connectJunctionHandler,
						disconnectJunctionHandler,
					),
			)
			.addService(
				'deleteExecutor',
				({ db, uniqueWhereExpander, predicateFactory, updateBuilderFactory, whereBuilder }) =>
					new DeleteExecutor(
						this.schema.model,
						db,
						uniqueWhereExpander,
						predicateFactory,
						whereBuilder,
						updateBuilderFactory,
					),
			)

			.addService(
				'mapper',
				({
					db,
					predicateFactory,
					predicatesInjector,
					selectBuilderFactory,
					insertBuilderFactory,
					updateBuilderFactory,
					uniqueWhereExpander,
					whereBuilder,
					junctionTableManager,
					mapperAccessor,
					deleteExecutor,
					providers,
				}) => {
					const mapper = new Mapper(
						this.schema.model,
						db,
						predicateFactory,
						predicatesInjector,
						selectBuilderFactory,
						insertBuilderFactory,
						updateBuilderFactory,
						uniqueWhereExpander,
						whereBuilder,
						junctionTableManager,
						deleteExecutor,
						providers,
					)
					mapperAccessor.set(mapper)

					return mapper
				},
			)
			.addService('queryAstFactory', () => new GraphQlQueryAstFactory(this.argumentValuesResolver))
			.addService('readResolver', ({ mapper, queryAstFactory }) => new ReadResolver(mapper, queryAstFactory))
			.addService('validationDependencyCollector', () => new DependencyCollector())
			.addService('validationQueryAstFactory', () => new QueryAstFactory(this.schema.model))
			.addService(
				'dataSelector',
				({ validationQueryAstFactory, mapper }) =>
					new ValidationDataSelector(this.schema.model, validationQueryAstFactory, mapper),
			)
			.addService('dependencyPruner', () => new DependencyPruner(this.schema.model))
			.addService(
				'validationContextFactory',
				({ dataSelector, dependencyPruner, providers }) =>
					new ValidationContextFactory(this.schema.model, dataSelector, dependencyPruner, providers),
			)
			.addService(
				'inputValidator',
				({ validationDependencyCollector, validationContextFactory, dataSelector }) =>
					new InputValidator(
						this.schema.validation,
						this.schema.model,
						validationDependencyCollector,
						validationContextFactory,
						dataSelector,
					),
			)
			.addService(
				'mutationResolver',
				({ mapper, uniqueWhereExpander, inputValidator, queryAstFactory }) =>
					new MutationResolver(mapper, uniqueWhereExpander, inputValidator, queryAstFactory),
			)
			.addService('validationResolver', ({ inputValidator }) => new ValidationResolver(inputValidator))

			.build()

		return innerDic.pick('readResolver', 'mutationResolver', 'validationResolver')
	}
}
