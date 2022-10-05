import { TenantMigrationsRunner } from '../migrations'
import { createLogger, PrettyPrintLoggerHandler } from '@contember/logger'

let uuidNum = 0
export const testUuid = () => '123e4567-e89b-12d3-a456-' + (uuidNum++).toString().padStart(12, '0')

;(async () => {
	const migrationsRunner = new TenantMigrationsRunner(
		{
			database: process.env.PGDATABASE as string,
			host: process.env.PGHOST as string,
			password: process.env.PGPASSWORD as string,
			user: process.env.PGUSER as string,
			port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
		},
		'tenant',
		{
			rootToken: '0',
		},
		{
			bcrypt: () => {
				throw new Error()
			},
			uuid: testUuid,
		},
	)
	await migrationsRunner.run(createLogger(new PrettyPrintLoggerHandler(process.stderr)))
})().catch(e => {
	// eslint-disable-next-line no-console
	console.error(e)
	process.exit(1)
})
