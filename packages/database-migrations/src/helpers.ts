import { MigrationBuilder } from 'node-pg-migrate'
import MigrationBuilderImpl from 'node-pg-migrate/dist/migration-builder.js'
import { escapeValue as pgEscape } from 'node-pg-migrate/dist/utils.js'

export function createMigrationBuilder(): MigrationBuilder & { getSql: () => string; getSqlSteps: () => string[] } {
	return new MigrationBuilderImpl(
		{
			query: null,
			select: null,
		} as any,
		{},
		false,
		{} as any,
	)
}

export function escapeValue(value: any): any {
	return pgEscape(value)
}
