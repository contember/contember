import { Command } from '../Command'
import { ConflictActionType, InsertBuilder } from '@contember/database'

export class SetProjectSecretCommand implements Command<void> {
	constructor(private readonly projectId: string, private key: string, private value: Buffer) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const id = providers.uuid()
		const { value, version } = await providers.encrypt(this.value)
		const qb = InsertBuilder.create()
			.into('project_secret')
			.values({
				id,
				project_id: this.projectId,
				key: this.key,
				value,
				version,
				created_at: providers.now(),
				updated_at: providers.now(),
			})
			.onConflict(ConflictActionType.update, ['project_id', 'key'], {
				value,
				version,
				updated_at: providers.now(),
			})
		await qb.execute(db)
	}
}
