import { ConflictActionType, InsertBuilder, wrapIdentifier } from '@contember/database'
import { formatSchemaName } from '../../helpers'
import { InitEventQuery } from '../../queries'
import { StageConfig } from '../../../types'
import { Command } from '../Command'

export class CreateOrUpdateStageCommand implements Command<boolean> {
	constructor(private readonly stage: StageConfig, private readonly eventId?: string) {}

	public async execute({ db, providers }: Command.Args): Promise<boolean> {
		const eventId = this.eventId || (await db.createQueryHandler().fetch(new InitEventQuery())).id

		const result = await InsertBuilder.create()
			.into('stage')
			.values({
				id: providers.uuid(),
				name: this.stage.name,
				slug: this.stage.slug,
				event_id: eventId,
			})
			.onConflict(ConflictActionType.update, ['slug'], {
				name: this.stage.name,
			})
			.returning('event_id')
			.execute(db)

		await db.query('CREATE SCHEMA IF NOT EXISTS ' + wrapIdentifier(formatSchemaName(this.stage)))

		return result.length === 1 && result[0].event_id === eventId
	}
}
