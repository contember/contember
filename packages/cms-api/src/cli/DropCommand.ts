import { Config, DatabaseCredentials } from '../config/config'
import Knex from 'knex'
import CommandConfiguration from '../core/cli/CommandConfiguration'
import { formatSchemaName } from '../system-api/model/helpers/stageHelpers'
import Command from '../core/cli/Command'

class DropCommand extends Command<{}, {}> {
	constructor(private readonly config: Config) {
		super()
	}

	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Deletes all db schemas (including tenant and both data and system schemas of projects)')
	}

	protected async execute(): Promise<void> {

		const queries = []

		queries.push(this.clear(this.config.tenant.db, ['tenant']))

		for (const project of this.config.projects) {
			const schemas = [...project.stages.map(stage => formatSchemaName(stage)), 'system']
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
}

export default DropCommand
