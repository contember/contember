import { Command } from './Command'
import { ConflictActionType, InsertBuilder } from '@contember/database'

export class SetProjectSecretCommand implements Command<void> {
	constructor(private readonly projectId: string, private key: string, private value: string) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const id = providers.uuid()
		const { iv, encrypted } = await providers.encrypt(Buffer.from(this.value))
		const qb = InsertBuilder.create()
			.into('project_secret')
			.values({
				id,
				project_id: this.projectId,
				key: this.key,
				value_encrypted: encrypted.toString('base64'),
				iv: iv.toString('base64'),
				created_at: providers.now(),
				updated_at: providers.now(),
			})
			.onConflict(ConflictActionType.update, ['project_id', 'key'], {
				value_encrypted: encrypted.toString('base64'),
				iv: iv.toString('base64'),
				updated_at: providers.now(),
			})
		await qb.execute(db)
	}
}
