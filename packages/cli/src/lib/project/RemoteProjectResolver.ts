import { parseDsn } from '../dsn.js'
import { RemoteProject } from './RemoteProject.js'
import { CliEnv } from '../env.js'
import { ApiCredentialsResolver } from '../credentials/ApiCredentials.js'

export class RemoteProjectResolver {
	constructor(
		private readonly cliEnv: CliEnv,
		private readonly credentialsResolver: ApiCredentialsResolver = new ApiCredentialsResolver(cliEnv),
	) {
	}

	resolve(identifier?: string, adminEndpoint?: string): RemoteProject | undefined {
		let endpoint: string | undefined
		let dsnPassword: string | undefined
		let project: string | undefined
		if (identifier?.includes('://')) {
			;({ endpoint, project, token: dsnPassword } = parseDsn(identifier))
		} else if (this.cliEnv.dsn) {
			;({ endpoint, project, token: dsnPassword } = parseDsn(this.cliEnv.dsn))
		} else {
			endpoint = this.cliEnv.apiUrl
			project = !identifier || identifier === '.' ? this.cliEnv.projectName : identifier
		}
		if (!project || !endpoint) {
			return undefined
		}
		const credentials = this.credentialsResolver.resolve(dsnPassword)
		if (!credentials) {
			return undefined
		}
		if (endpoint.endsWith('/')) {
			endpoint = endpoint.slice(0, -1)
		}

		if (!adminEndpoint && endpoint.endsWith('.contember.cloud') && !endpoint.includes('://api-')) {
			adminEndpoint = endpoint
			endpoint += '/_api'
		}

		return new RemoteProject(project, endpoint, credentials, adminEndpoint)
	}
}
