import { Schema } from '@contember/schema'
import { MapperFactory } from '../mapper'
import { wrapIdentifier } from '@contember/database'

export class RefreshViewResolver {
	constructor(
		private readonly schema: Schema,
		private readonly mapperFactory: MapperFactory,
	) {
	}

	public async resolve(entity: string, options?: { concurrently?: boolean }): Promise<{ ok: boolean }> {
		const mapper = this.mapperFactory.create()
		const entityModel = this.schema.model.entities[entity]
		if (!entityModel) {
			throw new Error(`Entity ${entity} not found`)
		}
		const concurrently = options?.concurrently ? ' CONCURRENTLY' : ''
		await mapper.db.query(`REFRESH MATERIALIZED VIEW${concurrently} ${wrapIdentifier(mapper.db.schema)}.${wrapIdentifier(entityModel.tableName)}`)

		return { ok: true }
	}
}
