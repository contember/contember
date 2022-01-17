import { MigrationBuilder } from 'node-pg-migrate'
import { Client, ClientConfig } from 'pg'
import { ClientError, ClientErrorCodes, DatabaseCredentials } from '@contember/database'

export function createMigrationBuilder(): MigrationBuilder & { getSql: () => string; getSqlSteps: () => string[] } {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const builderClass = require('node-pg-migrate/dist/migration-builder').default
	return new builderClass(
		{},
		{
			query: null,
			select: null,
		},
	)
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pgEscape = require('node-pg-migrate/dist/utils').escapeValue

export function escapeValue(value: any): any {
	return pgEscape(value)
}

const wrapIdentifier = (value: string) => '"' + value.replace(/"/g, '""') + '"'

export async function createPgClient(cfg: ClientConfig): Promise<Client> {
	const client = (await import('pg')).Client
	return new client(cfg)
}

export const createDatabaseIfNotExists = async (db: DatabaseCredentials, log: (message: string) => void) => {
	const Connection = (await import('@contember/database')).Connection
	try {
		const connection = new Connection(db, {})
		await connection.query('SELECT 1')
		await connection.end()
		return
	} catch (e) {
		if (!(e instanceof ClientError && e.code === ClientErrorCodes.INVALID_CATALOG_NAME)) {
			throw e
		}
	}

	log(`Database ${db.database} does not exist, attempting to create it...`)
	const connection = new Connection({ ...db, database: 'postgres' }, {})
	await connection.query(`CREATE DATABASE ${wrapIdentifier(db.database)}`)
	await connection.end()
}
