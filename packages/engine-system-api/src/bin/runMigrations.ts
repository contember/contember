import { SystemMigrationsRunner } from '../migrations'
import { DatabaseContextFactory, emptyVersionedSchema, SchemaVersionBuilder } from '../model'
import { createLogger, PrettyPrintLoggerHandler } from '@contember/logger'


import { SchemaDatabaseMetadataResolver } from '../model'
import { dummySchemaDatabaseMetadata } from '@contember/schema-utils';

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
		{ db: dbConfig, slug: 'test', stages: [] },
		'system',
		{
			buildSchema: () => Promise.resolve(emptyVersionedSchema),
		} as unknown as SchemaVersionBuilder,
		{},
		{
			resolveMetadata: () => Promise.resolve(dummySchemaDatabaseMetadata),
		} as unknown as SchemaDatabaseMetadataResolver,
	)
	// eslint-disable-next-line no-console
	await migrationsRunner.run(createLogger(new PrettyPrintLoggerHandler(process.stderr)))
})().catch(e => {
	// eslint-disable-next-line no-console
	console.error(e)
	process.exit(1)
})
