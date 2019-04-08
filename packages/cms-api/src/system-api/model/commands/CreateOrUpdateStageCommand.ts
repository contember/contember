import KnexWrapper from '../../../core/knex/KnexWrapper'
import InsertBuilder from '../../../core/knex/InsertBuilder'
import { formatSchemaName } from '../helpers/stageHelpers'
import { StageWithoutEvent } from '../dtos/Stage'

class CreateOrUpdateStageCommand {
	constructor(private readonly stage: StageWithoutEvent) {
	}

	public async execute(connection: KnexWrapper): Promise<boolean> {
		const initEvent = (await connection
			.selectBuilder()
			.from('event')
			.select('id')
			.where({ type: 'init' })
			.getResult())[0]

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

		await connection.raw('CREATE SCHEMA IF NOT EXISTS ??', formatSchemaName(this.stage))

		return result.length === 1 && result[0] === initEvent.id
	}
}

export default CreateOrUpdateStageCommand
