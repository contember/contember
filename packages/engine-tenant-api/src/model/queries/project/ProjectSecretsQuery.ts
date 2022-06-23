import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { Providers } from '../../providers.js'

type ProjectSecretsQueryResult = { key: string; value: Buffer; needsReEncrypt: boolean }[]

export class ProjectSecretsQuery extends DatabaseQuery<ProjectSecretsQueryResult> {
	constructor(private readonly projectId: string, private readonly providers: Providers) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ProjectSecretsQueryResult> {
		const qb = SelectBuilder.create<{ value: Buffer; version: number; key: string }>()
			.from('project_secret')
			.where({
				project_id: this.projectId,
			})
			.select('value')
			.select('version')
			.select('key')
		const rows = await qb.getResult(db)
		return await Promise.all(
			rows.map(async it => {
				return ({
					key: it.key,
					...await this.providers.decrypt(it.value, it.version),
				})
			},
			),
		)
	}
}
