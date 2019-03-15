export function createMigrationBuilder() {
	const builderClass = require('node-pg-migrate/dist/migration-builder')
	return new builderClass(
		{},
		{
			query: null,
			select: null,
		}
	)
}
