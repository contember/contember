import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'

export class ChangeProfileCommand implements Command<void> {
	constructor(private readonly personId: string, private readonly email?: string, private readonly name?: string | null) { }

	async execute({ db }: Command.Args): Promise<void> {
		const data: {
			email?: string
			name?: string | null
		} = {}

		if (this.email !== undefined) {
			data.email = this.email
		}
		if (this.name !== undefined) {
			data.name = this.name
		}

		await UpdateBuilder.create()
			.table('person')
			.values(data)
			.where({
				id: this.personId,
			})
			.execute(db)
	}
}
