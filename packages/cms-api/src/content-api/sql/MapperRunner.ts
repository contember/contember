import Mapper from './Mapper'
import KnexWrapper from '../../core/knex/KnexWrapper'
import MapperFactory from './MapperFactory'

class MapperRunner {
	constructor(
		private readonly db: KnexWrapper,
		private readonly mapperFactory: MapperFactory,
		private readonly identityId: string,
	) {
	}

	public run(cb: (mapper: Mapper) => void) {
		return this.db.transaction(async trx => {
			await trx.raw('SELECT set_config(?, ?, false)', 'tenant.identity_id', this.identityId)
			const mapper = this.mapperFactory.create(trx)
			return cb(mapper)
		})
	}
}

export default MapperRunner
