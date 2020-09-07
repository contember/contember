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

import path from 'path'
import Db, { DBConnection } from 'node-pg-migrate/dist/db'
import { loadMigrationFiles } from 'node-pg-migrate/dist/migration'
import { LogFn, Logger, RunnerOptionClient, RunnerOptionUrl } from 'node-pg-migrate/dist/types'
import { createSchemalize, getSchemas } from 'node-pg-migrate/dist/utils'
import migrateSqlFile from 'node-pg-migrate/dist/sqlMigration'
import { MigrationBuilder } from 'node-pg-migrate'
import { createMigrationBuilder } from './helpers'

export interface RunnerOptionConfig {
	migrationsTable: string
	migrationsSchema?: string
	schema?: string
	dir: string
	ignorePattern?: string
	file?: string
	createSchema?: boolean
	createMigrationsSchema?: boolean
	log?: LogFn
	logger?: Logger
	verbose?: boolean
	migrationArgs?: any
}

export declare type RunnerOption = RunnerOptionConfig & (RunnerOptionClient | RunnerOptionUrl)

// Random but well-known identifier shared by all instances of node-pg-migrate
const PG_MIGRATE_LOCK_ID = 7241865325823964

const idColumn = 'id'
const nameColumn = 'name'
const runOnColumn = 'run_on'

export class Migration {
	public name: string
	constructor(
		public readonly filePath: string,
		public readonly migration: (builder: MigrationBuilder, args: any) => Promise<void>,
	) {
		this.name = path.basename(filePath, path.extname(filePath))
	}
}

const loadMigrations = async (db: DBConnection, options: RunnerOption) => {
	try {
		const files = await loadMigrationFiles(options.dir, options.ignorePattern)
		return Promise.all(
			files.map(async file => {
				const filePath = `${options.dir}/${file}`
				const actions =
					path.extname(filePath) === '.sql'
						? (await migrateSqlFile(filePath)).up
						: // eslint-disable-next-line @typescript-eslint/no-var-requires
						  require(path.relative(__dirname, filePath)).default
				return new Migration(filePath, actions)
			}),
		)
	} catch (err) {
		throw new Error(`Can't get migration files: ${err.stack}`)
	}
}

const lock = async (db: DBConnection): Promise<void> => {
	await db.select(`select pg_advisory_lock(${PG_MIGRATE_LOCK_ID})`)
}

const unlock = async (db: DBConnection): Promise<void> => {
	const [result] = await db.select(`select pg_advisory_unlock(${PG_MIGRATE_LOCK_ID}) as "lockReleased"`)

	if (!result.lockReleased) {
		throw new Error('Failed to release migration lock')
	}
}

const getMigrationsTableName = (options: RunnerOption): string => {
	const schema = options.migrationsSchema || options.schema || 'public'
	const { migrationsTable } = options
	return createSchemalize(
		false,
		true,
	)({
		schema,
		name: migrationsTable,
	})
}
const ensureMigrationsTable = async (db: DBConnection, options: RunnerOption): Promise<void> => {
	try {
		const fullTableName = getMigrationsTableName(options)
		await db.query(
			`CREATE TABLE IF NOT EXISTS ${fullTableName} ( ${idColumn} SERIAL PRIMARY KEY, ${nameColumn} varchar(255) NOT NULL, ${runOnColumn} timestamp NOT NULL)`,
		)
	} catch (err) {
		throw new Error(`Unable to ensure migrations table: ${err.stack}`)
	}
}

const getRunMigrations = async (db: DBConnection, options: RunnerOption) => {
	const fullTableName = getMigrationsTableName(options)
	return db.column(nameColumn, `SELECT ${nameColumn} FROM ${fullTableName} ORDER BY ${runOnColumn}, ${idColumn}`)
}

const getMigrationsToRun = (options: RunnerOption, runNames: string[], migrations: Migration[]): Migration[] => {
	return migrations.filter(({ name }) => runNames.indexOf(name) < 0 && (!options.file || options.file === name))
}

const checkOrder = (runNames: string[], migrations: Migration[]) => {
	const len = Math.min(runNames.length, migrations.length)
	for (let i = 0; i < len; i += 1) {
		const runName = runNames[i]
		const migrationName = migrations[i].name
		if (runName !== migrationName) {
			throw new Error(`Not run migration ${migrationName} is preceding already run migration ${runName}`)
		}
	}
}

const getLogger = ({ log, logger, verbose }: RunnerOption): Logger => {
	let loggerObject: Logger = console
	if (typeof logger === 'object') {
		loggerObject = logger
	} else if (typeof log === 'function') {
		loggerObject = { debug: log, info: log, warn: log, error: log }
	}
	return verbose ? loggerObject : { ...loggerObject, debug: undefined }
}

export default async (options: RunnerOption): Promise<{ name: string }[]> => {
	const logger = getLogger(options)
	const db = Db((options as RunnerOptionClient).dbClient || (options as RunnerOptionUrl).databaseUrl, logger)
	try {
		await db.createConnection()
		await lock(db)

		if (options.schema) {
			const schemas = getSchemas(options.schema)
			if (options.createSchema) {
				await Promise.all(schemas.map(schema => db.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)))
			}
			await db.query(`SET search_path TO ${schemas.map(s => `"${s}"`).join(', ')}`)
		}
		if (options.migrationsSchema && options.createMigrationsSchema) {
			await db.query(`CREATE SCHEMA IF NOT EXISTS "${options.migrationsSchema}"`)
		}

		await ensureMigrationsTable(db, options)

		const [migrations, runNames] = await Promise.all([loadMigrations(db, options), getRunMigrations(db, options)])

		checkOrder(runNames, migrations)

		const toRun: Migration[] = getMigrationsToRun(options, runNames, migrations)

		if (!toRun.length) {
			logger.info('No migrations to run!')
			return []
		}

		logger.info('Migrating files:')
		toRun.forEach(m => {
			logger.info(`- ${m.name}`)
		})

		await db.query('BEGIN')
		try {
			for (const migration of toRun) {
				const migrationsBuilder = createMigrationBuilder()
				await migration.migration(migrationsBuilder, options.migrationArgs)
				const steps = migrationsBuilder.getSqlSteps()

				for (const sql of steps) {
					await db.query(sql)
				}

				await db.query(
					`INSERT INTO ${getMigrationsTableName(options)} (${nameColumn}, ${runOnColumn}) VALUES ('${
						migration.name
					}', NOW());`,
				)
			}
			await db.query('COMMIT')
		} catch (err) {
			logger.warn('Rolling back attempted migration ...')
			await db.query('ROLLBACK')
			throw err
		}

		return toRun.map(m => ({
			name: m.name,
		}))
	} finally {
		await unlock(db).catch(error => logger.warn(error.message))
		db.close()
	}
}
