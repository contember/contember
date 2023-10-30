import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'

export type ChangeProfileData = {
	readonly email?: string
	readonly name?: string | null
}

export class ChangeProfileCommand implements Command<void> {
	constructor(private readonly personId: string, private readonly data: ChangeProfileData) { }

	async execute({ db }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person')
			.values(this.data)
			.where({
				id: this.personId,
			})
			.execute(db)
	}
}
