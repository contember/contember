import { ApiCredentialsResolver } from '../credentials/ApiCredentials.js'
import { parseDsn } from '../dsn.js'
import type { CliEnv } from '../env.js'
import type { TenantConnection } from './TenantConnection.js'

export class TenantConnectionResolver {
	constructor(
		private readonly cliEnv: CliEnv,
		private readonly credentialsResolver: ApiCredentialsResolver = new ApiCredentialsResolver(cliEnv),
	) {
	}

	public resolve(): TenantConnection | undefined {
		let endpoint: string | undefined
		let dsnPassword: string | undefined
		if (this.cliEnv.dsn) {
			;({ endpoint, token: dsnPassword } = parseDsn(this.cliEnv.dsn))
		} else {
			endpoint = this.cliEnv.apiUrl
		}
		if (!endpoint) {
			return undefined
		}
		const credentials = this.credentialsResolver.resolve(dsnPassword)
		if (!credentials) {
			return undefined
		}
		if (endpoint.endsWith('/')) {
			endpoint = endpoint.slice(0, -1)
		}
		if (endpoint.endsWith('.contember.cloud') && !endpoint.includes('://api-')) {
			endpoint += '/_api'
		}
		return { endpoint, credentials }
	}
}
