import { TenantApiTransport } from './tenant/TenantApiTransport.js'
import {
	createTenantClients,
	TenantApiKeyClient,
	TenantClients,
	TenantMemberClient,
	TenantPersonClient,
	TenantPolicyClient,
	TenantProjectClient,
} from './tenant/clients/index.js'
import type { TenantConnectionSource } from './tenant/TenantConnection.js'

export class TenantClientProvider {
	constructor(
		private readonly connectionSource: TenantConnectionSource,
	) {
	}

	/** Kept as the historical accessor — `tenant apply` and the migration facade only ever needed the project domain. */
	public get(): TenantProjectClient {
		return this.project()
	}

	public project(): TenantProjectClient {
		return this.clients().project
	}

	public person(): TenantPersonClient {
		return this.clients().person
	}

	public member(): TenantMemberClient {
		return this.clients().member
	}

	public apiKey(): TenantApiKeyClient {
		return this.clients().apiKey
	}

	public policy(): TenantPolicyClient {
		return this.clients().policy
	}

	public clients(): TenantClients {
		return createTenantClients(this.transport())
	}

	public transport(): TenantApiTransport {
		const connection = this.connectionSource.get()
		return TenantApiTransport.create(connection.endpoint, connection.token)
	}
}
