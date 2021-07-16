import { Providers } from './model'

export interface TenantCredentials {
	loginToken?: string
	rootEmail?: string
	rootToken?: string
	rootPassword?: string
}

export interface TenantMigrationArgs {
	credentials: TenantCredentials
	providers: Pick<Providers, 'bcrypt'>
}
