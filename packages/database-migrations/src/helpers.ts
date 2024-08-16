import { MigrationBuilder } from 'node-pg-migrate'
import { Migration, RunMigration } from './Migration'
import MigrationBuilderImpl from 'node-pg-migrate/dist/migration-builder.js'
import { escapeValue as pgEscape } from 'node-pg-migrate/dist/utils.js'

export function createMigrationBuilder(): MigrationBuilder & { getSql: () => string; getSqlSteps: () => string[] } {
	const impl = 'default' in MigrationBuilderImpl ? (MigrationBuilderImpl as any).default : MigrationBuilderImpl
	return new impl(
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

export const timePrefixLength = 'YYYY-MM-DD-XXXXXX'.length

export const checkOrder = (runMigrations: RunMigration[], migrations: Migration<any>[]) => {
	const len = Math.min(runMigrations.length, migrations.length)
	for (let i = 0; i < len; i++) {
		const run = runMigrations[i]
		const migrationName = migrations[i].name
		if (migrationName > run.name) {
			throw new Error(`Previously executed migration ${run} is missing`)
		}
		if (run.name > migrationName) {
			throw new Error(`Not executed migration ${migrationName} is preceding already run migration ${run.name}`)
		}
	}
}
