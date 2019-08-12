import { Client } from '@contember/database'
import { uuid } from '../../../utils/uuid'
import Command from './Command'

class CreateIdentityCommand implements Command<string> {
	constructor(private readonly roles: string[]) {}

	public async execute(db: Client): Promise<string> {
		const identityId = uuid()
		await db
			.insertBuilder()
			.into('identity')
			.values({
				id: identityId,
				parent_id: null,
				roles: JSON.stringify(this.roles),
			})
			.execute()

		return identityId
	}
}

export default CreateIdentityCommand
