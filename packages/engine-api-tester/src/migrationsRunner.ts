import pgMigrate, { ClientConfig } from 'node-pg-migrate'

export async function migrate({ db, schema, dir }: { db: ClientConfig; schema: string; dir: string }) {
	await pgMigrate({
		databaseUrl: db,
		dir: dir,
		schema: schema,
		migrationsTable: 'migrations',
		checkOrder: true,
		direction: 'up',
		count: Infinity,
		ignorePattern: '^\\..*$',
		createSchema: true,
		singleTransaction: true,
		log: () => null,
	})
}
