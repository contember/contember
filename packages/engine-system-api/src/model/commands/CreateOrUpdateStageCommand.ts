import { ConflictActionType, InsertBuilder, wrapIdentifier } from '@contember/database'
import { formatSchemaName } from '../helpers'
import { InitEventQuery } from '../queries'
import { StageConfig } from '../../types'
import { UuidProvider } from '../../utils/uuid'
import { Command } from './Command'

class CreateOrUpdateStageCommand implements Command<boolean> {
	constructor(private readonly stage: StageConfig) {}

	public async execute({ db, providers }: Command.Args): Promise<boolean> {
		const initEvent = await db.createQueryHandler().fetch(new InitEventQuery())

		const result = await InsertBuilder.create()
			.into('stage')
			.values({
				id: providers.uuid(),
				name: this.stage.name,
				slug: this.stage.slug,
				event_id: initEvent.id,
			})
			.onConflict(ConflictActionType.update, ['slug'], {
				name: this.stage.name,
			})
			.returning('event_id')
			.execute(db)

		await db.query('CREATE SCHEMA IF NOT EXISTS ' + wrapIdentifier(formatSchemaName(this.stage)))

		return result.length === 1 && result[0] === initEvent.id
	}
}

export default CreateOrUpdateStageCommand
