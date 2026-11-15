import { Migration, RunMigration } from './Migration.js'
import { MigrationBuilder } from './MigrationBuilder.js'

export { escapeValue } from './MigrationBuilder.js'

export function createMigrationBuilder(): MigrationBuilder {
	return new MigrationBuilder()
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
