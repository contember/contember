import { MigrationsRunner, DatabaseCredentials } from '@contember/database-migrations'

export async function migrate({ db, schema, dir }: { db: DatabaseCredentials; schema: string; dir: string }) {
	const runner = new MigrationsRunner(db, schema, dir)
	await runner.migrate(false)
}
