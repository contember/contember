import { MigrationBuilder } from 'node-pg-migrate'
import { Client, ClientConfig } from 'pg'
import { Connection, DatabaseCredentials, wrapIdentifier } from '@contember/database'

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

export function createPgClient(cfg: ClientConfig) {
	return new Client(cfg)
}

export const createDatabaseIfNotExists = async (db: DatabaseCredentials) => {
	const connection = new Connection({ ...db, database: 'postgres' }, {})
	const result = await connection.query('SELECT 1 FROM "pg_database" WHERE "datname" = ?', [db.database])

	if (result.rowCount === 0) {
		// eslint-disable-next-line no-console
		console.warn(`Database ${db.database} does not exist, attempting to create it...`)
		await connection.query(`CREATE DATABASE ${wrapIdentifier(db.database)}`)
	}

	await connection.end()
}
