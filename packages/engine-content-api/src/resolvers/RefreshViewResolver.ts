import { Schema } from '@contember/schema'
import { MapperFactory } from '../mapper'
import { wrapIdentifier } from '@contember/database'

export class RefreshViewResolver {
	constructor(
		private readonly schema: Schema,
		private readonly mapperFactory: MapperFactory,
	) {
	}

	public async resolve(entity: string): Promise<{ ok: boolean }> {
		const mapper = this.mapperFactory.create()
		const entityModel = this.schema.model.entities[entity]
		if (!entityModel) {
			throw new Error(`Entity ${entity} not found`)
		}
		await mapper.db.query(`REFRESH MATERIALIZED VIEW ${wrapIdentifier(mapper.db.schema)}.${wrapIdentifier(entityModel.tableName)}`)

		return { ok: true }
	}
}
