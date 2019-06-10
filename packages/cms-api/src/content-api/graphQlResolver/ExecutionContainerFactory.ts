import Container from '../../core/di/Container'
import { Acl, Schema } from 'cms-common'
import JoinBuilder from '../sql/select/JoinBuilder'
import ConditionBuilder from '../sql/select/ConditionBuilder'
import WhereBuilder from '../sql/select/WhereBuilder'
import SelectBuilderFactory from '../sql/select/SelectBuilderFactory'
import InsertBuilderFactory from '../sql/insert/InsertBuilderFactory'
import UpdateBuilderFactory from '../sql/update/UpdateBuilderFactory'
import { Context } from '../types'
import PredicatesInjector from '../../acl/PredicatesInjector'
import VariableInjector from '../../acl/VariableInjector'
import PredicateFactory from '../../acl/PredicateFactory'
import UniqueWhereExpander from './UniqueWhereExpander'
import ReadResolver from './ReadResolver'
import MutationResolver from './MutationResolver'
import JunctionTableManager from '../sql/JunctionTableManager'
import OrderByBuilder from '../sql/select/OrderByBuilder'
import JunctionFetcher from '../sql/select/JunctionFetcher'
import Mapper from '../sql/Mapper'
import { Accessor } from '../../utils/accessor'
import FieldsVisitorFactory from '../sql/select/handlers/FieldsVisitorFactory'
import DbSelectBuilder from '../../core/database/SelectBuilder'
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

export interface ExecutionContainer {
	readResolver: ReadResolver
	mutationResolver: MutationResolver
	validationResolver: ValidationResolver
}

class ExecutionContainerFactory {
	constructor(private readonly schema: Schema, private readonly permissions: Acl.Permissions) {}

	public create(context: Pick<Context, 'db' | 'identityVariables'>): Container<ExecutionContainer> {
		const that = this
		const innerDic = new Container.Builder({})
			.addService('db', () => context.db)

			.addService('variableInjector', () => new VariableInjector(this.schema.model, context.identityVariables))
			.addService(
				'predicateFactory',
				({ variableInjector }) => new PredicateFactory(this.permissions, variableInjector)
			)
			.addService(
				'predicatesInjector',
				({ predicateFactory }) => new PredicatesInjector(this.schema.model, predicateFactory)
			)
			.addService('joinBuilder', () => new JoinBuilder(this.schema.model))
			.addService('conditionBuilder', () => new ConditionBuilder())
			.addService(
				'whereBuilder',
				({ joinBuilder, conditionBuilder, db }) =>
					new WhereBuilder(this.schema.model, joinBuilder, conditionBuilder, db)
			)
			.addService('orderByBuilder', ({ joinBuilder }) => new OrderByBuilder(this.schema.model, joinBuilder))
			.addService(
				'junctionFetcher',
				({ whereBuilder, orderByBuilder, predicatesInjector, db }) =>
					new JunctionFetcher(db, whereBuilder, orderByBuilder, predicatesInjector)
			)
			.addService('mapperAccessor', () => new Accessor<Mapper>())
			.addService(
				'fieldsVisitorFactory',
				({ junctionFetcher, mapperAccessor, predicateFactory, whereBuilder }) =>
					new FieldsVisitorFactory(this.schema.model, junctionFetcher, mapperAccessor, predicateFactory, whereBuilder)
			)
			.addService(
				'metaHandler',
				({ whereBuilder, predicateFactory }) => new MetaHandler(whereBuilder, predicateFactory)
			)
			.addService('uniqueWhereExpander', () => new UniqueWhereExpander(this.schema.model))
			.addService(
				'hasManyToHasOneReducer',
				({ mapperAccessor, uniqueWhereExpander }) =>
					new HasManyToHasOneReducerExecutionHandler(this.schema.model, mapperAccessor, uniqueWhereExpander)
			)
			.addService('selectHandlers', ({ hasManyToHasOneReducer }) => ({
				[HasManyToHasOneReducer.extensionName]: hasManyToHasOneReducer,
			}))
			.addService(
				'selectBuilderFactory',
				({
					joinBuilder,
					whereBuilder,
					orderByBuilder,
					predicateFactory,
					fieldsVisitorFactory,
					metaHandler,
					selectHandlers,
				}) =>
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
								selectHandlers
							)
						}
					})()
			)
			.addService(
				'insertBuilderFactory',
				({ whereBuilder, db }) => new InsertBuilderFactory(this.schema.model, whereBuilder, db)
			)
			.addService(
				'updateBuilderFactory',
				({ whereBuilder, db }) => new UpdateBuilderFactory(this.schema.model, whereBuilder, db)
			)

			.addService('connectJunctionHandler', ({ db }) => new JunctionTableManager.JunctionConnectHandler(db))
			.addService('disconnectJunctionHandler', ({ db }) => new JunctionTableManager.JunctionDisconnectHandler(db))
			.addService(
				'junctionTableManager',
				({ uniqueWhereExpander, predicateFactory, whereBuilder, connectJunctionHandler, disconnectJunctionHandler }) =>
					new JunctionTableManager(
						this.schema.model,
						predicateFactory,
						uniqueWhereExpander,
						whereBuilder,
						connectJunctionHandler,
						disconnectJunctionHandler
					)
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
						updateBuilderFactory
					)
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
						deleteExecutor
					)
					mapperAccessor.set(mapper)

					return mapper
				}
			)

			.addService('readResolver', ({ mapper, uniqueWhereExpander }) => new ReadResolver(mapper, uniqueWhereExpander))
			.addService('validationDependencyCollector', () => new DependencyCollector())
			.addService('validationQueryAstFactory', () => new QueryAstFactory(this.schema.model))
			.addService(
				'dataSelector',
				({ validationQueryAstFactory, mapper }) =>
					new ValidationDataSelector(this.schema.model, validationQueryAstFactory, mapper)
			)
			.addService(
				'validationContextFactory',
				({ dataSelector }) => new ValidationContextFactory(this.schema.model, dataSelector)
			)
			.addService(
				'inputValidator',
				({ validationDependencyCollector, validationContextFactory, dataSelector }) =>
					new InputValidator(
						this.schema.validation,
						this.schema.model,
						validationDependencyCollector,
						validationContextFactory,
						dataSelector
					)
			)
			.addService(
				'mutationResolver',
				({ mapper, uniqueWhereExpander, inputValidator }) =>
					new MutationResolver(mapper, uniqueWhereExpander, inputValidator)
			)
			.addService('validationResolver', ({ inputValidator }) => new ValidationResolver(inputValidator))

			.build()

		return innerDic.pick('readResolver', 'mutationResolver', 'validationResolver')
	}
}

export default ExecutionContainerFactory
