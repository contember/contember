import { MigrationBuilder } from 'node-pg-migrate'
import { Client, ClientConfig } from 'pg'

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
