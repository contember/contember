import { Response } from 'node-fetch'
import { ApiRequest, ApiRequestSender } from './ApiRequestSender'

type SystemApiRequest = Omit<ApiRequest, 'path'> & { project: string }

export class SystemClient {
	constructor(
		private apiRequestSender: ApiRequestSender,
	) {}

	public async migrate({ token, projectGroup, project, migrations }: {
		token: string,
		project: string,
		projectGroup: string | undefined,
		migrations: Migration[]
	}): Promise<void> {
		const query = `
mutation($migrations: [Migration!]!) {
	migrate(migrations: $migrations) {
		ok
		error {
			code
		}
	}
}
`
		const response = await this.request({ project, projectGroup, token, variables: { migrations }, query })
		if (!response.ok) {
			throw new Error(response.statusText)
		}
		const responseBody = await response.json()
		if (responseBody.errors?.[0]?.extensions?.code === 'FORBIDDEN') {
			throw new ForbiddenError()
		}
		if (responseBody.errors) {
			throw new Error(responseBody.errors[0].message)
		}
		if (!responseBody.data.migrate.ok) {
			throw new Error(responseBody.data.migrate.error.code)
		}
	}

	private async request({ project, ...request }: SystemApiRequest): Promise<Response> {
		return this.apiRequestSender.send({ ...request, path: `system/${project}` })
	}
}

export class ForbiddenError extends Error {}

export interface MigrationInfo {
	readonly version: string // YYYY-MM-DD-HHIISS
	readonly name: string // version-label
	readonly formatVersion: number
}

interface Migration extends MigrationInfo {
	readonly modifications: readonly Migration.Modification[]
}

namespace Migration {
	export type Modification<Data = { [field: string]: any }> = { modification: string } & Data
}
