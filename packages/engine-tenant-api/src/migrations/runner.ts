import { Connection, createDatabaseIfNotExists, DatabaseConfig, EventManager } from '@contember/database'
import { TenantMigrationArgs } from './types'
import { loadMigrations, Migration, MigrationsRunner as DbMigrationsRunner } from '@contember/database-migrations'
import tenantCredentials from './2020-06-08-134000-tenant-credentials'
import { computeTokenHash, Providers } from '../model'
import { Logger } from '@contember/engine-common'

export interface TenantCredentials {
	loginToken?: string
	rootEmail?: string
	rootToken?: string
	rootTokenHash?: string
	rootPassword?: string
}

const getMigrations = (): Promise<Migration<TenantMigrationArgs>[]> => {
	return loadMigrations(process.env.CONTEMBER_TENANT_MIGRATIONS_DIR || __dirname, [
		new Migration('2020-06-08-134000-tenant-credentials', tenantCredentials),
	])
}

export class TenantMigrationsRunner {
	constructor(
		private readonly db: DatabaseConfig,
		private readonly schema: string,
		private readonly tenantCredentials: TenantCredentials,
		private readonly providers: Providers,
	) {
	}

	public async run(logger: Logger): Promise<{ name: string }[]> {
		await createDatabaseIfNotExists(this.db, message => typeof message === 'string' ? logger.warn(message) : logger.error(message))
		const connection = Connection.createSingle(this.db, err => logger.error(err))
		const result = await connection.scope(async connection => {
			const innerRunner = new DbMigrationsRunner<TenantMigrationArgs>(connection, this.schema, getMigrations)
			return await innerRunner.migrate(message => logger.warn(message), {
				getCredentials: async () => ({
					loginTokenHash: this.tenantCredentials.loginToken ? computeTokenHash(this.tenantCredentials.loginToken) : undefined,
					rootTokenHash: this.tenantCredentials.rootTokenHash
						?? (this.tenantCredentials.rootToken ? computeTokenHash(this.tenantCredentials.rootToken) : undefined),
					rootEmail: this.tenantCredentials.rootEmail,
					rootPasswordBcrypted: this.tenantCredentials.rootPassword ? await this.providers.bcrypt(this.tenantCredentials.rootPassword) : undefined,
				}),
			})
		})
		await connection.end()
		return result
	}
}
