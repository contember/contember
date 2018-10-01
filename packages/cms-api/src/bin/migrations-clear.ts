#!/usr/bin/env node
import { DatabaseCredentials, parseConfig } from '../tenant-api/config'
import * as Knex from 'knex'
import { readFile } from 'fs'
import { promisify } from 'util'
import Command from '../core/cli/Command'

const fsRead = promisify(readFile)

const command = new class extends Command<{ configFileName: string }> {
	protected parseArguments(argv: string[]): { configFileName: string } {
		if (typeof argv[2] !== 'string') {
			throw new Command.InvalidArgumentError(`Usage: node ${process.argv[1]} path/to/config.yaml`)
		}
		return { configFileName: argv[2] }
	}

	protected async execute(args: { configFileName: string }): Promise<void> {
		const file = await fsRead(args.configFileName, { encoding: 'utf8' })
		const config = parseConfig(file)

		const queries = []

		queries.push(this.clear(config.tenant.db, ['tenant']))

		for (const project of config.projects) {
			const schemas = [...project.stages.map(stage => 'stage_' + stage.slug), 'system']
			queries.push(this.clear(project.dbCredentials, schemas))
		}

		await Promise.all(queries)
	}

	private async clear(db: DatabaseCredentials, schemas: string[]) {
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
}()

command.run()
