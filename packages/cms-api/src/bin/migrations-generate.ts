#!/usr/bin/env node
import SchemaBuilder from '../content-schema/builder/SchemaBuilder'
import SchemaMigrator from '../content-schema/differ/SchemaMigrator'
import diffSchemas from '../content-schema/differ/diffSchemas'
import { zeroPad } from '../utils/zeroPad'
import SqlMigrator from '../content-api/sqlSchema/SqlMigrator'

const fs = require('fs')

const projectName = process.argv[2]

if (typeof projectName === 'undefined') {
	console.log(`Usage: node ${process.argv[1]} projectName`)
	process.exit(1)
}

const migrationsDir = `${process.cwd()}/src/projects/${projectName}/generated`
const modelDir = `${process.cwd()}/dist/src/projects/${projectName}/src/model.js`

let currentSchema = new SchemaBuilder().buildSchema()

const files: string[] = fs.readdirSync(migrationsDir)
files
	.filter(file => {
		return file.endsWith('.json') && fs.lstatSync(`${migrationsDir}/${file}`).isFile()
	})
	.sort()
	.map(file => {
		const diff = JSON.parse(fs.readFileSync(`${migrationsDir}/${file}`))
		currentSchema = SchemaMigrator.applyDiff(currentSchema, diff)
	})

import(modelDir).then(newSchema => {
	const diff = diffSchemas(currentSchema, newSchema.default)
	if (diff !== null) {
		const now = new Date()
		const year = now.getFullYear()
		const month = zeroPad(now.getMonth(), 2)
		const day = zeroPad(now.getDay(), 2)
		const hours = zeroPad(now.getHours(), 2)
		const minutes = zeroPad(now.getMinutes(), 2)
		const seconds = zeroPad(now.getSeconds(), 2)
		const name = `${migrationsDir}/${year}-${month}-${day}-${hours}${minutes}${seconds}`
		fs.writeFileSync(name + '.json', JSON.stringify(diff))
		console.log(name + '.json created')
		fs.writeFileSync(name + '.sql', SqlMigrator.applyDiff(currentSchema, diff))
		console.log(name + '.sql created')
	} else {
		console.log('Nothing to do')
	}
	process.exit(0)
})
