import { Client } from '@contember/database'
import { InsertBuilder } from '@contember/database'
import { formatSchemaName } from '../helpers/stageHelpers'
import InitEventQuery from '../queries/InitEventQuery'
import { wrapIdentifier } from '@contember/database'
import { StageConfig } from '../../types'
import { UuidProvider } from '../../utils/uuid'

class CreateOrUpdateStageCommand {
	constructor(private readonly stage: StageConfig, private readonly providers: UuidProvider) {}

	public async execute(connection: Client): Promise<boolean> {
		const initEvent = await connection.createQueryHandler().fetch(new InitEventQuery())

		const result = await connection
			.insertBuilder()
			.into('stage')
			.values({
				id: this.providers.uuid(),
				name: this.stage.name,
				slug: this.stage.slug,
				event_id: initEvent.id,
			})
			.onConflict(InsertBuilder.ConflictActionType.update, ['slug'], {
				name: this.stage.name,
			})
			.returning('event_id')
			.execute()

		await connection.query('CREATE SCHEMA IF NOT EXISTS ' + wrapIdentifier(formatSchemaName(this.stage)))

		return result.length === 1 && result[0] === initEvent.id
	}
}

export default CreateOrUpdateStageCommand
