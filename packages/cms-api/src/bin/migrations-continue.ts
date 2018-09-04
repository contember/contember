#!/usr/bin/env node
import pgMigrate from 'node-pg-migrate'
import { parseConfig, DatabaseCredentials } from '../tenant-api/config'
const fs = require('fs')

async function migrate(db: DatabaseCredentials, schema: string, dir: string) {
	await pgMigrate({
		databaseUrl: db,
		dir: dir,
		schema: schema,
		migrationsTable: 'migrations',
		checkOrder: true,
		direction: 'up',
		count: Infinity,
		ignorePattern: '^\\..*$',
		createSchema: true,
		singleTransaction: true,
		log: (msg: string) => {
			console.log('    ' + msg.replace(/\n/g, '\n    '))
		}
	})
}

const migrationsDir = `${__dirname}/../../../src/migrations`

const configFileName = process.argv[2]
if (typeof configFileName === 'undefined') {
	console.log(`Usage: node ${process.argv[1]} path/to/config.yaml`)
	process.exit(1)
}

fs.readFile(configFileName, async (e: Error, file: string) => {
	if (e) throw e

	const config = parseConfig(file, (error: string) => {
		console.log(error + '\n')
		process.exit(2)
	})

	console.log('Executing tenant schema migrations')
	await migrate(config.tenant.db, 'tenant', `${migrationsDir}/tenant`)

	console.log('\n')
	for (const project of config.projects) {
		console.log(`Executing event schema migrations for project ${project.slug}`)
		await migrate(project.dbCredentials, 'system', `${migrationsDir}/project`)
		console.log('\n')
	}
})
