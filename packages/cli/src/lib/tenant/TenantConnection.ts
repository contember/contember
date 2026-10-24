import type { ApiCredentials } from '../credentials/ApiCredentials.js'

export interface TenantConnection {
	readonly endpoint: string
	readonly credentials: ApiCredentials
}

export interface TenantConnectionSource {
	get(): TenantConnection
}
