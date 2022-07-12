/*
This file is based on migration runner from node-pg-migrate. (https://github.com/salsita/node-pg-migrate)

The MIT License (MIT)

Copyright (c) 2016-2020 Salsita Software &lt;jando@salsitasoft.com&gt;

Copyright (c) 2014-2016 Theo Ephraim

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

import { createMigrationBuilder } from './helpers'
import { Connection, withDatabaseAdvisoryLock, wrapIdentifier } from '@contember/database'
import { Migration } from './Migration'

export type RunnerOption = {
	migrationsTable: string
	schema: string
	log: (msg: string) => void
	migrationArgs?: any
}


// Random but well-known identifier shared by all instances of node-pg-migrate
const PG_MIGRATE_LOCK_ID = 7241865325823964

const getMigrationsTableName = (options: RunnerOption): string => {
	return `${wrapIdentifier(options.schema)}.${wrapIdentifier(options.migrationsTable)}`
}
const ensureMigrationsTable = async (db: Connection.ConnectionLike, options: RunnerOption): Promise<void> => {
	try {
		const fullTableName = getMigrationsTableName(options)
		await db.query(`
			CREATE TABLE IF NOT EXISTS ${fullTableName} (
				id SERIAL PRIMARY KEY,
				name varchar(255) NOT NULL,
				run_on timestamp NOT NULL
			)`,
		)
	} catch (err) {
		if (!(err instanceof Error)) {
			throw err
		}
		throw new Error(`Unable to ensure migrations table: ${err.stack}`)
	}
}

const getRunMigrations = async (db: Connection.ConnectionLike, options: RunnerOption) => {
	const fullTableName = getMigrationsTableName(options)
	return (await db.query<{name: string}>(`SELECT name FROM ${fullTableName} ORDER BY run_on, id`)).rows.map(it => it.name)
}

const getMigrationsToRun = (options: RunnerOption, runNames: string[], migrations: Migration[]): Migration[] => {
	return migrations.filter(({ name }) => runNames.indexOf(name) < 0)
}

const checkOrder = (runNames: string[], migrations: Migration[]) => {
	const len = Math.min(runNames.length, migrations.length)
	for (let i = 0; i < len; i += 1) {
		const runName = runNames[i]
		const migrationName = migrations[i].name
		if (runName < migrationName) {
			throw new Error(`Previously run migration ${runName} is missing`)
		}
		if (runName !== migrationName) {
			throw new Error(`Not run migration ${migrationName} is preceding already run migration ${runName}`)
		}
	}
}

export default async (
	getMigrations: () => Promise<Migration[]>,
	connection: Connection.ConnectionLike,
	options: RunnerOption,
): Promise<{ name: string }[]> => {
	const logger = options.log
	return await connection.scope(db =>
		withDatabaseAdvisoryLock(db, PG_MIGRATE_LOCK_ID, async () => {
			await db.query(`CREATE SCHEMA IF NOT EXISTS ${wrapIdentifier(options.schema)}`)
			await db.query(`SET search_path TO ${wrapIdentifier(options.schema)}`)
			await ensureMigrationsTable(db, options)


			const runNames = await getRunMigrations(db, options)
			const migrations = await getMigrations()
			checkOrder(runNames, migrations)

			const toRun: Migration[] = getMigrationsToRun(options, runNames, migrations)

			if (!toRun.length) {
				return []
			}
			logger(`Migrating ${toRun.length} file(s):`)
			return await db.transaction(async trx => {
				try {
					for (const migration of toRun) {
						try {
							logger(`  Executing migration ${migration.name}...`)
							const migrationsBuilder = createMigrationBuilder()
							await migration.migration(migrationsBuilder, options.migrationArgs)
							const steps = migrationsBuilder.getSqlSteps()

							for (const sql of steps) {
								await trx.query(sql)
							}

							await trx.query(
								`INSERT INTO ${getMigrationsTableName(options)} (name, run_on) VALUES (?, NOW());`,
								[migration.name],
							)
							logger(`  Done`)
						} catch (e) {
							logger(`  FAILED`)
							throw e
						}
					}
				} catch (err) {
					logger('Rolling back attempted migration ...')
					await trx.rollback()
					throw err
				}
				return toRun.map(m => ({
					name: m.name,
				}))

			})
		}),
	)

}
