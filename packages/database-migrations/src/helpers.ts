import { MigrationBuilder } from 'node-pg-migrate'
import { Migration, RunMigration } from './Migration'

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

export const timePrefixLength = 'YYYY-MM-DD-XXXXXX'.length


export const createMigrationVersionPrefixGenerator = () => {
	let inc = 0
	return () => createMigrationVersionTimePrefix(inc++)
}

export const createMigrationVersionTimePrefix = (increment: number) => {
	const now = new Date()
	now.setSeconds(now.getSeconds() + increment)
	const year = now.getFullYear()
	const month = (now.getMonth() + 1).toString().padStart(2, '0')
	const day = now.getDate().toString().padStart(2, '0')
	const hours = now.getHours().toString().padStart(2, '0')
	const minutes = now.getMinutes().toString().padStart(2, '0')
	const seconds = now.getSeconds().toString().padStart(2, '0')

	return `${year}-${month}-${day}-${hours}${minutes}${seconds}`
}

export const checkOrder = (runMigrations: RunMigration[], migrations: Migration<any>[]) => {
	const len = Math.min(runMigrations.length, migrations.length)
	for (let i = 0; i < len; i += 1) {
		const run = runMigrations[i]
		const migrationName = migrations[i].name
		if (run.name < migrationName) {
			throw new Error(`Previously run migration ${run} is missing`)
		}
		if (run.name !== migrationName) {
			throw new Error(`Not run migration ${migrationName} is preceding already run migration ${run}`)
		}
	}
}
