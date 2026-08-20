export interface TenantConnection {
	readonly endpoint: string
	readonly token: string
}

export interface TenantConnectionSource {
	get(): TenantConnection
}
