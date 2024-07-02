import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'
import { Schema } from '@contember/schema'
import { SchemaWithMeta } from '../../migrations'

export class SchemaQuery extends DatabaseQuery<SchemaWithMeta | null> {

	constructor(
		private readonly currentHash?: string,
	) {
		super()
	}


	async fetch(queryable: DatabaseQueryable): Promise<SchemaWithMeta | null> {
		const query = SelectBuilder.create<{
			schema: Schema
			checksum: string
			version: string
			updated_at: Date
			migration_id: number
		}>()
			.from('schema')
			.select(new Literal('*'))
			.where({
				id: 'single',
			})
			.match(it => {
				if (!this.currentHash) {
					return it
				}
				return it.where(it => it.raw('checksum != ?', this.currentHash))
			})

		const row =  this.fetchOneOrNull(await query.getResult(queryable.db))
		if (!row) {
			return null
		}
		return {
			schema: row.schema,
			meta: {
				checksum: row.checksum,
				version: row.version,
				updatedAt: row.updated_at,
				id: row.migration_id,
			},
		}
	}
}
