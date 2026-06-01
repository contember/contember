import { Providers } from '../model/index.js'

export interface TenantMigrationArgs {
	getCredentials: () => Promise<{
		loginTokenHash?: string
		rootEmail?: string
		rootTokenHash?: string
		rootPasswordBcrypted?: string
	}>
	providers: Pick<Providers, 'uuid'>
}
