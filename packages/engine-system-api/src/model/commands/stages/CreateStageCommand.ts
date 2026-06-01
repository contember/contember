import { InsertBuilder, wrapIdentifier } from '@contember/database'
import { StageConfig } from '../../../types.js'
import { Command } from '../Command.js'
import { formatSchemaName } from '../../helpers/index.js'

export class CreateStageCommand implements Command<void> {
	constructor(private readonly stage: StageConfig) {}

	public async execute({ db, providers }: Command.Args): Promise<void> {
		const schemaName = this.stage.schema ?? formatSchemaName(this.stage)
		await InsertBuilder.create()
			.into('stage')
			.values({
				id: providers.uuid(),
				name: this.stage.name,
				slug: this.stage.slug,
				schema: schemaName,
			})
			.execute(db)

		await db.query('CREATE SCHEMA IF NOT EXISTS ' + wrapIdentifier(schemaName))
	}
}
