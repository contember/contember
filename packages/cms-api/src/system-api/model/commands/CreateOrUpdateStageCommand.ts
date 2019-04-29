import Client from '../../../core/database/Client'
import InsertBuilder from '../../../core/database/InsertBuilder'
import { formatSchemaName } from '../helpers/stageHelpers'
import { StageWithoutEvent } from '../dtos/Stage'
import InitEventQuery from '../queries/InitEventQuery'
import { wrapIdentifier } from '../../../core/database/utils'

class CreateOrUpdateStageCommand {
	constructor(private readonly stage: StageWithoutEvent) {}

	public async execute(connection: Client): Promise<boolean> {
		const initEvent = await connection.createQueryHandler().fetch(new InitEventQuery())

		const result = await connection
			.insertBuilder()
			.into('stage')
			.values({
				id: this.stage.id,
				name: this.stage.name,
				slug: this.stage.slug,
				event_id: initEvent.id,
			})
			.onConflict(InsertBuilder.ConflictActionType.update, ['id'], {
				name: this.stage.name,
				slug: this.stage.slug,
			})
			.returning('event_id')
			.execute()

		await connection.query('CREATE SCHEMA IF NOT EXISTS ' + wrapIdentifier(formatSchemaName(this.stage)))

		return result.length === 1 && result[0] === initEvent.id
	}
}

export default CreateOrUpdateStageCommand
