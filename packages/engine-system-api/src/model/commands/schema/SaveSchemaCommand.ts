import { ConflictActionType, InsertBuilder } from '@contember/database'
import { Command } from '../Command'
import { SchemaWithMeta } from '../../migrations'

export class SaveSchemaCommand implements Command<void> {
	constructor(private readonly input: SchemaWithMeta) {}

	public async execute({ db }: Command.Args): Promise<void> {
		if (!this.input.meta.updatedAt) {
			throw new Error('Cannot persist empty schema')
		}

		await InsertBuilder.create()
			.into('schema')
			.values({
				schema: this.input.schema,
				updated_at: this.input.meta.updatedAt.toISOString(),
				checksum: this.input.meta.checksum,
				version: this.input.meta.version,
				migration_id: this.input.meta.id,
			})
			.onConflict(ConflictActionType.update, ['id'], {
				schema: expr => expr.select(['excluded', 'schema']),
				updated_at: expr => expr.select(['excluded', 'updated_at']),
				checksum: expr => expr.select(['excluded', 'checksum']),
				version: expr => expr.select(['excluded', 'version']),
				migration_id: expr => expr.select(['excluded', 'migration_id']),
			})
			.execute(db)
	}
}
