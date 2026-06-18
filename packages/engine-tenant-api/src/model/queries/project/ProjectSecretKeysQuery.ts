import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

export interface ProjectSecretInfoRow {
	readonly key: string
	readonly created_at: Date
	readonly updated_at: Date
}

/**
 * Lists a project's secret KEYS (and timestamps) without ever reading the
 * encrypted values — used to show which secrets exist. For reading values use
 * {@link ProjectSecretsQuery} via SecretsManager.readSecrets.
 */
export class ProjectSecretKeysQuery extends DatabaseQuery<ProjectSecretInfoRow[]> {
	constructor(private readonly projectId: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ProjectSecretInfoRow[]> {
		return await SelectBuilder.create<ProjectSecretInfoRow>()
			.from('project_secret')
			.where({ project_id: this.projectId })
			.select('key')
			.select('created_at')
			.select('updated_at')
			.orderBy('key')
			.getResult(db)
	}
}
