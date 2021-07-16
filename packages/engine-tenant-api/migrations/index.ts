import { Migration, loadMigrations } from '@contember/database-migrations'
import tenantCredentials from './2020-06-08-134000-tenant-credentials'
export default function (): Promise<Migration[]> {
	return loadMigrations(process.env.CONTEMBER_TENANT_MIGRATIONS_DIR || __dirname, [
		new Migration('2020-06-08-134000-tenant-credentials', tenantCredentials),
	])
}
