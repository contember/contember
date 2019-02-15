import Container from '../../core/di/Container'
import { Acl, Model } from 'cms-common'
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
import DbSelectBuilder from '../../core/knex/SelectBuilder'
import SelectHydrator from '../sql/select/SelectHydrator'
import SelectBuilder from '../sql/select/SelectBuilder'
import MetaHandler from '../sql/select/handlers/MetaHandler'
import HasManyToHasOneReducerExecutionHandler from '../extensions/hasManyToHasOneReducer/HasManyToHasOneReducerExecutionHandler'
import HasManyToHasOneReducer from '../extensions/hasManyToHasOneReducer/HasManyToHasOneReducer'
import DeleteExecutor from '../sql/delete/DeleteExecutor'

class ExecutionContainerFactory {
	constructor(private readonly schema: Model.Schema, private readonly permissions: Acl.Permissions) {}

	public create(
		context: Pick<Context, 'db' | 'identityVariables'>
	): Container<{ readResolver: ReadResolver; mutationResolver: MutationResolver }> {
		const that = this
		const innerDic = new Container.Builder({})
			.addService('db', () => context.db)

			.addService('variableInjector', () => new VariableInjector(this.schema, context.identityVariables))
			.addService(
				'predicateFactory',
				({ variableInjector }) => new PredicateFactory(this.permissions, variableInjector)
			)
			.addService('predicatesInjector', ({ predicateFactory }) => new PredicatesInjector(this.schema, predicateFactory))
			.addService('joinBuilder', () => new JoinBuilder(this.schema))
			.addService('conditionBuilder', () => new ConditionBuilder())
			.addService(
				'whereBuilder',
				({ joinBuilder, conditionBuilder }) => new WhereBuilder(this.schema, joinBuilder, conditionBuilder)
			)
			.addService('orderByBuilder', ({ joinBuilder }) => new OrderByBuilder(this.schema, joinBuilder))
			.addService(
				'junctionFetcher',
				({ whereBuilder, orderByBuilder, predicatesInjector, db }) =>
					new JunctionFetcher(db, whereBuilder, orderByBuilder, predicatesInjector)
			)
			.addService('mapperAccessor', () => new Accessor<Mapper>())
			.addService(
				'fieldsVisitorFactory',
				({ junctionFetcher, mapperAccessor, predicateFactory, whereBuilder }) =>
					new FieldsVisitorFactory(this.schema, junctionFetcher, mapperAccessor, predicateFactory, whereBuilder)
			)
			.addService(
				'metaHandler',
				({ whereBuilder, predicateFactory }) => new MetaHandler(whereBuilder, predicateFactory)
			)
			.addService('uniqueWhereExpander', () => new UniqueWhereExpander(this.schema))
			.addService(
				'hasManyToHasOneReducer',
				({ mapperAccessor, uniqueWhereExpander }) =>
					new HasManyToHasOneReducerExecutionHandler(this.schema, mapperAccessor, uniqueWhereExpander)
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
					new class implements SelectBuilderFactory {
						create(qb: DbSelectBuilder, hydrator: SelectHydrator): SelectBuilder {
							return new SelectBuilder(
								that.schema,
								whereBuilder,
								orderByBuilder,
								metaHandler,
								qb,
								hydrator,
								fieldsVisitorFactory,
								selectHandlers
							)
						}
					}()
			)
			.addService(
				'insertBuilderFactory',
				({ whereBuilder, db }) => new InsertBuilderFactory(this.schema, whereBuilder, db)
			)
			.addService(
				'updateBuilderFactory',
				({ whereBuilder, db }) => new UpdateBuilderFactory(this.schema, whereBuilder, db)
			)

			.addService('connectJunctionHandler', ({ db }) => new JunctionTableManager.JunctionConnectHandler(db))
			.addService('disconnectJunctionHandler', ({ db }) => new JunctionTableManager.JunctionDisconnectHandler(db))
			.addService(
				'junctionTableManager',
				({ uniqueWhereExpander, predicateFactory, whereBuilder, connectJunctionHandler, disconnectJunctionHandler }) =>
					new JunctionTableManager(
						this.schema,
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
					new DeleteExecutor(this.schema, db, uniqueWhereExpander, predicateFactory, whereBuilder, updateBuilderFactory)
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
						this.schema,
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
			.addService(
				'mutationResolver',
				({ mapper, predicatesInjector, uniqueWhereExpander }) => new MutationResolver(mapper, uniqueWhereExpander)
			)

			.build()

		return new Container.Builder({})
			.addService('readResolver', () => innerDic.get('readResolver'))
			.addService('mutationResolver', () => innerDic.get('mutationResolver'))
			.build()
	}
}

export default ExecutionContainerFactory
