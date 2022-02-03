import { createDatabaseIfNotExists, DatabaseCredentials, SingleConnection } from '@contember/database'
import { TenantMigrationArgs } from './types'
import { loadMigrations, Migration, MigrationsRunner as DbMigrationsRunner } from '@contember/database-migrations'
import tenantCredentials from './2020-06-08-134000-tenant-credentials'
import { computeTokenHash, Providers } from '../model'

export interface TenantCredentials {
	loginToken?: string
	rootEmail?: string
	rootToken?: string
	rootTokenHash?: string
	rootPassword?: string
}

const getMigrations = (): Promise<Migration[]> => {
	return loadMigrations(process.env.CONTEMBER_TENANT_MIGRATIONS_DIR || __dirname, [
		new Migration('2020-06-08-134000-tenant-credentials', tenantCredentials),
	])
}

export class MigrationsRunnerFactory {
	constructor(
		private readonly db: DatabaseCredentials,
		private readonly tenantCredentials: TenantCredentials,
		private readonly providers: Providers,
	) {
	}

	public create(schema: string): MigrationsRunner {
		return new MigrationsRunner(
			schema,
			this.db,
			{
				getCredentials: async () => ({
					loginTokenHash: this.tenantCredentials.loginToken ? computeTokenHash(this.tenantCredentials.loginToken) : undefined,
					rootTokenHash: this.tenantCredentials.rootTokenHash
						?? (this.tenantCredentials.rootToken ? computeTokenHash(this.tenantCredentials.rootToken) : undefined),
					rootEmail: this.tenantCredentials.rootEmail,
					rootPasswordBcrypted: this.tenantCredentials.rootPassword ? await this.providers.bcrypt(this.tenantCredentials.rootPassword) : undefined,
				}),
			},
		)
	}
}

export class MigrationsRunner {
	constructor(
		private readonly schema: string,
		private readonly db: DatabaseCredentials,
		private readonly args: TenantMigrationArgs,
	) {
	}

	public async run(log: (msg: string) => void): Promise<{ name: string }[]> {
		await createDatabaseIfNotExists(this.db, log)
		const connection = new SingleConnection(this.db, {})
		const innerRunner = new DbMigrationsRunner<TenantMigrationArgs>(connection, this.schema, getMigrations)
		const result = await innerRunner.migrate(log, this.args)
		await connection.end()
		return result
	}
}
