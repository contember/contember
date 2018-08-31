import PredicateFactory from "../../acl/PredicateFactory";
import Mapper from "./mapper";
import { Model } from 'cms-common'
import KnexConnection from "../../core/knex/KnexConnection";

class MapperRunner {
	constructor(
		private readonly schema: Model.Schema,
		private readonly predicateFactory: PredicateFactory,
	) {
	}

	public run(db: KnexConnection, cb: (mapper: Mapper) => void) {
		return db.wrapper().transaction(trx => {
			const mapper = new Mapper(this.schema, trx, this.predicateFactory)
			return cb(mapper)
		})
	}
}

export default MapperRunner
