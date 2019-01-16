import KnexWrapper from '../../../core/knex/KnexWrapper'
import { EventType } from '../EventType'
import { uuid } from '../../../utils/uuid'

class CreateEventCommand {
	constructor(
		private readonly type: EventType,
		private readonly data: any,
		private readonly previousId: string | null
	) {}

	public async execute(db: KnexWrapper): Promise<string> {
		const id = uuid()
		await db
			.insertBuilder()
			.into('event')
			.values({
				id,
				type: 'run_migration',
				data: this.data,
				previous_id: this.previousId,
			})
			.execute()
		return id
	}
}

export default CreateEventCommand
