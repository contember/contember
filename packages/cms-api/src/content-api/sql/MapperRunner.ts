import PredicateFactory from "../../acl/PredicateFactory";
import Mapper from "./mapper";
import { Acl, Model } from 'cms-common'
import KnexConnection from "../../core/knex/KnexConnection";
import SelectBuilderFactory from "./select/SelectBuilderFactory";
import InsertBuilderFactory from "./insert/InsertBuilderFactory";

class MapperRunner {
	constructor(
		private readonly schema: Model.Schema,
		private readonly predicateFactory: PredicateFactory,
		private readonly selectBuilderFactory: SelectBuilderFactory,
		private readonly insertBuilderFactory: InsertBuilderFactory,
	) {
	}

	public run(db: KnexConnection, variables: Acl.VariablesMap, cb: (mapper: Mapper) => void) {
		return db.wrapper().transaction(trx => {
			const mapper = new Mapper(this.schema, trx, variables, this.predicateFactory, this.selectBuilderFactory, this.insertBuilderFactory)
			return cb(mapper)
		})
	}
}

export default MapperRunner
