import { MigrationBuilder } from 'node-pg-migrate'

export function createMigrationBuilder(): MigrationBuilder & { getSql: () => string } {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const builderClass = require('node-pg-migrate/dist/migration-builder')
	return new builderClass(
		{},
		{
			query: null,
			select: null,
		},
	)
}
