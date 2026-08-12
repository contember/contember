import { parseDsn } from '../dsn.js'
import type { CliEnv } from '../env.js'
import type { TenantConnection } from './TenantConnection.js'

export class TenantConnectionResolver {
	constructor(
		private readonly cliEnv: CliEnv,
	) {
	}

	public resolve(): TenantConnection | undefined {
		let endpoint: string | undefined
		let token: string | undefined
		if (this.cliEnv.dsn) {
			;({ endpoint, token } = parseDsn(this.cliEnv.dsn))
		} else {
			endpoint = this.cliEnv.apiUrl
			token = this.cliEnv.apiToken
		}
		if (!endpoint || !token) {
			return undefined
		}
		if (endpoint.endsWith('/')) {
			endpoint = endpoint.slice(0, -1)
		}
		if (endpoint.endsWith('.contember.cloud') && !endpoint.includes('://api-')) {
			endpoint += '/_api'
		}
		return { endpoint, token }
	}
}
