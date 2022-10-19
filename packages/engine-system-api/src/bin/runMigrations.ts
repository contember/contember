import { SystemMigrationsRunner } from '../migrations'
import { DatabaseContextFactory, emptyVersionedSchema, SchemaVersionBuilder } from '../model'
import { Connection } from '@contember/database'
import { createLogger, PrettyPrintLoggerHandler } from '@contember/logger'

let uuidNum = 0
export const testUuid = () => '123e4567-e89b-12d3-a456-' + (uuidNum++).toString().padStart(12, '0')

;(async () => {
	const dbConfig = {
		database: process.env.PGDATABASE as string,
		host: process.env.PGHOST as string,
		password: process.env.PGPASSWORD as string,
		user: process.env.PGUSER as string,
		port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
	}
	// eslint-disable-next-line no-console
	const connection = Connection.createSingle(dbConfig, err => console.error(err))
	const migrationsRunner = new SystemMigrationsRunner(
		new DatabaseContextFactory('system', connection, {
			uuid: testUuid,
		}),
		{ db: dbConfig, slug: 'test', stages: [] },
		'system',
		{
			buildSchema: () => Promise.resolve(emptyVersionedSchema),
		} as unknown as SchemaVersionBuilder,
		{},
	)
	// eslint-disable-next-line no-console
	await migrationsRunner.run(createLogger(new PrettyPrintLoggerHandler(process.stderr)))
})().catch(e => {
	// eslint-disable-next-line no-console
	console.error(e)
	process.exit(1)
})
