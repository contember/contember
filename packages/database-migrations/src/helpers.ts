// The legacy entry points load only the builder; the package root also loads the CLI runner (glob, jiti, pg).
import { MigrationBuilder } from 'node-pg-migrate/migrationBuilder'
import { escapeValue as pgEscape } from 'node-pg-migrate/utils/escapeValue'
import { Migration, RunMigration } from './Migration.js'

type BuilderDb = ConstructorParameters<typeof MigrationBuilder>[0]

// The builder only collects SQL; migrations that need the database get a connection through their args.
const noDatabase: BuilderDb = {
	query: () => Promise.reject(new Error('The migration builder has no database connection, use the connection from migration args')),
	select: () => Promise.reject(new Error('The migration builder has no database connection, use the connection from migration args')),
}

export function createMigrationBuilder(): MigrationBuilder {
	return new MigrationBuilder(noDatabase, {}, false, console)
}

export function escapeValue(value: any): string | number {
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
