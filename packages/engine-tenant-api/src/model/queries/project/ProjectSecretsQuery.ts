import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { Providers } from '../../providers'

export class ProjectSecretsQuery extends DatabaseQuery<Record<string, string>> {
	constructor(private readonly projectId: string, private readonly providers: Providers) {
		super()
	}
	async fetch({ db }: DatabaseQueryable): Promise<Record<string, string>> {
		const qb = SelectBuilder.create<{ value_encrypted: string; iv: string; key: string }>()
			.from('project_secret')
			.where({
				project_id: this.projectId,
			})
			.select('value_encrypted')
			.select('iv')
			.select('key')
		const rows = await qb.getResult(db)
		return Object.fromEntries(
			await Promise.all(
				rows.map(async it => [
					it.key,
					(
						await this.providers.decrypt(Buffer.from(it.value_encrypted, 'base64'), Buffer.from(it.iv, 'base64'))
					).toString(),
				]),
			),
		)
	}
}
