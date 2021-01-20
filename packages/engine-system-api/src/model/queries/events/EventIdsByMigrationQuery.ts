import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

export class EventIdsByMigrationQuery extends DatabaseQuery<string[]> {
	constructor(private readonly version: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<string[]> {
		const result = await SelectBuilder.create<{ id: string }>()
			.from('event')
			.where({ type: 'run_migration' })
			.where(expr => expr.raw(`data->>'version' = ?`, this.version))
			.select('id')
			.getResult(db)
		return result.map(it => it.id)
	}
}
