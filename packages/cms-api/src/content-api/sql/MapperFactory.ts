import Mapper from './Mapper'
import PredicateFactory from '../../acl/PredicateFactory'
import { Model } from 'cms-common'
import SelectBuilderFactory from './select/SelectBuilderFactory'
import InsertBuilderFactory from './insert/InsertBuilderFactory'
import UpdateBuilderFactory from './update/UpdateBuilderFactory'
import UniqueWhereExpander from '../graphQlResolver/UniqueWhereExpander'
import KnexWrapper from '../../core/knex/KnexWrapper'
import PredicatesInjector from '../../acl/PredicatesInjector'
import WhereBuilder from './select/WhereBuilder'
import JunctionTableManager from "./JunctionTableManager";

class MapperFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly predicateFactory: PredicateFactory,
		private readonly predicateInjector: PredicatesInjector,
		private readonly selectBuilderFactory: SelectBuilderFactory,
		private readonly insertBuilderFactory: InsertBuilderFactory,
		private readonly updateBuilderFactory: UpdateBuilderFactory,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
		private readonly whereBuilder: WhereBuilder,
		private readonly junctionTableManager: JunctionTableManager,
	) {}

	public create(trx: KnexWrapper): Mapper {
		return new Mapper(
			this.schema,
			trx,
			this.predicateFactory,
			this.predicateInjector,
			this.selectBuilderFactory,
			this.insertBuilderFactory,
			this.updateBuilderFactory,
			this.uniqueWhereExpander,
			this.whereBuilder,
			this.junctionTableManager,
		)
	}
}

export default MapperFactory
