import { Providers } from './model'

export const getTenantMigrationsDirectory = () => __dirname + '/../../migrations'

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
