import { CliError, ExitCode } from '@contember/cli-common'
import type { TenantConnection, TenantConnectionSource } from './TenantConnection.js'
import { TenantConnectionResolver } from './TenantConnectionResolver.js'

export class TenantConnectionProvider implements TenantConnectionSource {
	constructor(
		private readonly resolver: TenantConnectionResolver,
	) {
	}

	public get(): TenantConnection {
		const connection = this.resolver.resolve()
		if (!connection) {
			throw new CliError('Tenant connection not defined. Set CONTEMBER_DSN, or CONTEMBER_API_URL and CONTEMBER_API_TOKEN.', {
				code: 'TENANT_CONNECTION_NOT_DEFINED',
				exitCode: ExitCode.InputError,
			})
		}
		return connection
	}
}
