import Mapper from "./Mapper";
import KnexWrapper from "../../core/knex/KnexWrapper";
import MapperFactory from "./MapperFactory";

class MapperRunner {
	constructor(
		private readonly db: KnexWrapper,
		private readonly mapperFactory: MapperFactory
	) {
	}

	public run(cb: (mapper: Mapper) => void) {
		return this.db.transaction(trx => {
			const mapper = this.mapperFactory.create(trx)
			return cb(mapper)
		})
	}
}

export default MapperRunner
