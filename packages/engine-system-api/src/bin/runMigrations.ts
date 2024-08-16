import { SystemMigrationsRunner } from '../migrations'
import { DatabaseContextFactory, emptyVersionedSchema, SchemaProvider } from '../model'
import { DatabaseMetadataResolver, emptyDatabaseMetadata } from '@contember/database'
import { createLogger, PrettyPrintLoggerHandler } from '@contember/logger'


(async () => {
	const dbConfig = {
		database: process.env.PGDATABASE as string,
		host: process.env.PGHOST as string,
		password: process.env.PGPASSWORD as string,
		user: process.env.PGUSER as string,
		port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
	}
	const migrationsRunner = new SystemMigrationsRunner(
		new DatabaseContextFactory('system', {
			uuid: () => {
				throw new Error()
			},
		}),
		{ db: dbConfig, slug: 'test', stages: [], systemSchema: 'system' },
		{
			buildSchemaFromMigrations: () => Promise.resolve(emptyVersionedSchema),
		} as unknown as SchemaProvider,
		{},
		{
			resolveMetadata: () => Promise.resolve(emptyDatabaseMetadata),
		} as unknown as DatabaseMetadataResolver,
	)
	// eslint-disable-next-line no-console
	await migrationsRunner.run(createLogger(new PrettyPrintLoggerHandler(process.stderr)))
})().catch(e => {
	// eslint-disable-next-line no-console
	console.error(e)
	process.exit(1)
})
