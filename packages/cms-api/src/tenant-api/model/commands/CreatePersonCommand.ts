import Command from './Command'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import bcrypt from 'bcrypt'
import { uuid } from '../../../utils/uuid'

class CreatePersonCommand implements Command<string> {
	constructor(private readonly identityId: string, private readonly email: string, private readonly password: string) {}

	async execute(db: KnexWrapper): Promise<string> {
		const personId = uuid()

		await db
			.insertBuilder()
			.into('person')
			.values({
				id: personId,
				email: this.email,
				password_hash: await bcrypt.hash(this.password, 10),
				identity_id: this.identityId,
			})
			.execute()

		return personId
	}
}

export default CreatePersonCommand
