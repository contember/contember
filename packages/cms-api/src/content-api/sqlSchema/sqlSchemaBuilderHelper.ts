import { MigrationBuilder } from 'node-pg-migrate'

export function createMigrationBuilder(): MigrationBuilder & { getSql: () => string } {
	const builderClass = require('node-pg-migrate/dist/migration-builder')
	return new builderClass(
		{},
		{
			query: null,
			select: null,
		}
	)
}
