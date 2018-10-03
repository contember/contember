#!/usr/bin/env node
import SchemaMigrator from '../content-schema/differ/SchemaMigrator'
import diffSchemas from '../content-schema/differ/diffSchemas'
import { zeroPad } from '../utils/zeroPad'
import SqlMigrator from '../content-api/sqlSchema/SqlMigrator'
import * as fs from 'fs'
import { promisify } from 'util'
import Command from '../core/cli/Command'
import { emptySchema } from '../content-schema/modelUtils'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const readDir = promisify(fs.readdir)
const lstatFile = promisify(fs.lstat)
const mkdir = promisify(fs.mkdir)

interface Args {
	projectName: string
}

const command = new class extends Command<Args> {
	protected parseArguments(argv: string[]): Args {
		const projectName = argv[2]
		if (typeof projectName === 'undefined') {
			throw new Command.InvalidArgumentError(`Usage: node ${argv[1]} projectName`)
		}
		return { projectName };
	}

	protected async execute({ projectName }: Args): Promise<void> {

		const migrationsDir = `${process.cwd()}/src/projects/${projectName}/migrations`
		await mkdir(migrationsDir)
		const modelDir = `${process.cwd()}/dist/src/projects/${projectName}/src/model.js`

		const files: string[] = (await readDir(migrationsDir))
		const filteredFiles: string[] = await Promise.all(files
			.filter(file => file.endsWith('.json'))
			.filter(async file => {
			return (await lstatFile(`${migrationsDir}/${file}`)).isFile()
		}))

		const diffs = await Promise.all(
			filteredFiles
				.sort()
				.map(async file =>
					JSON.parse(await readFile(`${migrationsDir}/${file}`, { encoding: 'utf8' })))
		)

		const currentSchema = diffs.reduce((schema, diff) => SchemaMigrator.applyDiff(schema, diff), emptySchema)

		const newSchema = await import(modelDir)


		const diff = diffSchemas(currentSchema, newSchema.default.model)
		if (diff === null) {
			console.log('Nothing to do')
			return
		}
		const now = new Date()
		const year = now.getFullYear()
		const month = zeroPad(now.getMonth(), 2)
		const day = zeroPad(now.getDay(), 2)
		const hours = zeroPad(now.getHours(), 2)
		const minutes = zeroPad(now.getMinutes(), 2)
		const seconds = zeroPad(now.getSeconds(), 2)
		const name = `${migrationsDir}/${year}-${month}-${day}-${hours}${minutes}${seconds}`

		await Promise.all([
			writeFile(name + '.json', JSON.stringify(diff, undefined, "\t"), { encoding: 'utf8' }),
			writeFile(name + '.sql', SqlMigrator.applyDiff(currentSchema, diff), { encoding: 'utf8' }),

		])

		console.log(name + '.json created')
		console.log(name + '.sql created')
	}
}

command.run()
