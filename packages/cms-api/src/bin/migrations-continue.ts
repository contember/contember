#!/usr/bin/env node
import pgMigrate from 'node-pg-migrate'
import { DatabaseCredentials, parseConfig } from '../tenant-api/config'
import { readFile } from 'fs'
import { promisify } from 'util'
import Command from "../core/cli/Command";

const fsRead = promisify(readFile)


const command = new class extends Command<{ configFileName: string }> {

	protected parseArguments(argv: string[]): { configFileName: string } {
		if (typeof argv[2] !== 'string') {
			throw new Command.InvalidArgumentError(`Usage: node ${process.argv[1]} path/to/config.yaml`)
		}
		return { configFileName: argv[2] }
	}

	protected async execute(args: { configFileName: string }): Promise<void> {

		const migrationsDir = `${__dirname}/../../../src/migrations`
		const file = await fsRead(args.configFileName, { encoding: 'utf8' })
		const config = parseConfig(file)

		console.log('Executing tenant schema migrations')
		await this.migrate(config.tenant.db, 'tenant', `${migrationsDir}/tenant`)

		console.log('\n')
		for (const project of config.projects) {
			console.log(`Executing event schema migrations for project ${project.slug}`)
			await this.migrate(project.dbCredentials, 'system', `${migrationsDir}/project`)
			console.log('\n')
		}
	}

	private async migrate(db: DatabaseCredentials, schema: string, dir: string) {
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
			},
		})
	}
}

command.run()

