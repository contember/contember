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
import RelationFetchVisitorFactory from '../sql/select/RelationFetchVisitorFactory'
import Mapper from "../sql/Mapper";

class ExecutionContainerFactory {
	constructor(private readonly schema: Model.Schema, private readonly permissions: Acl.Permissions) {}

	public create(context: Context): Container<{ readResolver: ReadResolver; mutationResolver: MutationResolver }> {
		const innerDic = new Container.Builder({})

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
				({ whereBuilder, orderByBuilder, predicatesInjector }) =>
					new JunctionFetcher(whereBuilder, orderByBuilder, predicatesInjector)
			)
			.addService(
				'relationFetchVisitorFactory',
				({ junctionFetcher }) => new RelationFetchVisitorFactory(this.schema, junctionFetcher)
			)
			.addService(
				'selectBuilderFactory',
				({ joinBuilder, whereBuilder, orderByBuilder, predicateFactory, relationFetchVisitorFactory }) =>
					new SelectBuilderFactory(
						this.schema,
						joinBuilder,
						whereBuilder,
						orderByBuilder,
						predicateFactory,
						relationFetchVisitorFactory
					)
			)
			.addService('insertBuilderFactory', ({ whereBuilder }) => new InsertBuilderFactory(this.schema, whereBuilder))
			.addService('updateBuilderFactory', ({ whereBuilder }) => new UpdateBuilderFactory(this.schema, whereBuilder))
			.addService('uniqueWhereExpander', () => new UniqueWhereExpander(this.schema))

			.addService('connectJunctionHandler', ({}) => new JunctionTableManager.JunctionConnectHandler())
			.addService('disconnectJunctionHandler', ({}) => new JunctionTableManager.JunctionDisconnectHandler())
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
				'mapper',
				({
					predicateFactory,
					predicatesInjector,
					selectBuilderFactory,
					insertBuilderFactory,
					updateBuilderFactory,
					uniqueWhereExpander,
					whereBuilder,
					junctionTableManager,
				}) =>
					new Mapper(
						this.schema,
						context.db.wrapper(),
						predicateFactory,
						predicatesInjector,
						selectBuilderFactory,
						insertBuilderFactory,
						updateBuilderFactory,
						uniqueWhereExpander,
						whereBuilder,
						junctionTableManager
					)
			)

			.addService(
				'readResolver',
				({ mapper, uniqueWhereExpander }) => new ReadResolver(mapper, uniqueWhereExpander)
			)
			.addService(
				'mutationResolver',
				({ mapper, predicatesInjector, uniqueWhereExpander }) =>
					new MutationResolver(mapper, uniqueWhereExpander)
			)

			.build()

		return new Container.Builder({})
			.addService('readResolver', () => innerDic.get('readResolver'))
			.addService('mutationResolver', () => innerDic.get('mutationResolver'))
			.build()
	}
}

export default ExecutionContainerFactory
