export interface TenantMigrationArgs {
	getCredentials: () =>  Promise<{
		loginTokenHash?: string
		rootEmail?: string
		rootTokenHash?: string
		rootPasswordBcrypted?: string
	}>
}
