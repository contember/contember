import { Schema } from '@contember/schema'
import { MapperFactory } from '../mapper/index.js'
import { wrapIdentifier } from '@contember/database'
import { queryTransactionId, WriteRefSink } from '../WriteRefSink.js'

export class RefreshViewResolver {
	constructor(
		private readonly schema: Schema,
		private readonly mapperFactory: MapperFactory,
		private readonly writeRefSink?: WriteRefSink,
	) {
	}

	public async resolve(entity: string, options?: { concurrently?: boolean }): Promise<{ ok: boolean }> {
		const mapper = this.mapperFactory.create()
		const entityModel = this.schema.model.entities[entity]
		if (!entityModel) {
			throw new Error(`Entity ${entity} not found`)
		}
		const concurrently = options?.concurrently ? ' CONCURRENTLY' : ''
		const sql = `REFRESH MATERIALIZED VIEW${concurrently} ${wrapIdentifier(mapper.db.schema)}.${wrapIdentifier(entityModel.tableName)}`

		const writeRefSink = this.writeRefSink
		if (!writeRefSink) {
			await mapper.db.query(sql)
			return { ok: true }
		}

		// an explicit transaction is needed, because the id must be read before COMMIT, which discards it
		const transactionId = await mapper.db.transaction(async trx => {
			await trx.query(sql)
			return await queryTransactionId(trx)
		})
		if (transactionId !== null) {
			writeRefSink.record(transactionId)
		}

		return { ok: true }
	}
}
