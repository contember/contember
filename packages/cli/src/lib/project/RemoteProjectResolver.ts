import { parseDsn } from '../dsn'
import { RemoteProject } from './RemoteProject'
import { CliEnv } from '../env'

export class RemoteProjectResolver {
	constructor(
		private readonly cliEnv: CliEnv,
	) {
	}

	resolve(identifier?: string, adminEndpoint?: string): RemoteProject | undefined {
		let endpoint: string | undefined
		let token: string | undefined
		let project: string | undefined
		if (identifier?.includes('://')) {
			({ endpoint, project, token } = parseDsn(identifier))
		} else if (this.cliEnv.dsn) {
			({ endpoint, project, token } = parseDsn(this.cliEnv.dsn))
		} else {
			endpoint = this.cliEnv.apiUrl
			token = this.cliEnv.apiToken
			project = !identifier || identifier === '.' ? this.cliEnv.projectName : identifier
		}
		if (!project || !endpoint || !token) {
			return undefined
		}
		if (endpoint.endsWith('/')) {
			endpoint = endpoint.slice(0, -1)
		}

		if (!adminEndpoint && endpoint.endsWith('.contember.cloud') && !endpoint.includes('://api-')) {
			adminEndpoint = endpoint
			endpoint += '/_api'
		}

		return new RemoteProject(project, endpoint, token, adminEndpoint)
	}
}
