#!/usr/bin/env node
import { parseConfig, DatabaseCredentials } from '../tenant-api/config'
import * as Knex from 'knex'
const fs = require('fs')

const configFileName = process.argv[2]
if (typeof configFileName === 'undefined') {
	console.log(`Usage: node ${process.argv[1]} path/to/config.yaml`)
	process.exit(1)
}

async function clear(db: DatabaseCredentials, schemas: string[]) {
	await Knex({
		debug: false,
		client: 'pg',
		connection: db,
	}).transaction(async trx => {
		await Promise.all(
			schemas.map(async schema => {
				await trx.raw('DROP SCHEMA IF EXISTS ?? CASCADE', [schema])
				console.log(`Dropped schema ${schema} in DB ${db.database}`)
			})
		)
	})
}

fs.readFile(configFileName, async (e: Error, file: string) => {
	if (e) throw e

	const config = parseConfig(file, (error: string) => {
		console.log(error + '\n')
		process.exit(2)
	})

	const queries = []

	queries.push(clear(config.tenant.db, ['tenant']))

	for (const project of config.projects) {
		const schemas = [...project.stages.map(stage => 'stage_' + stage.slug), 'system']
		queries.push(clear(project.dbCredentials, schemas))
	}

	await Promise.all(queries)
	console.log('\n')
	process.exit(0)
})
