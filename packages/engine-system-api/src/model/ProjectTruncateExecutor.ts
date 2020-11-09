import { DatabaseContext } from './database'
import { ProjectConfig } from '../types'
import { ExecutedMigrationsResolver } from './migrations'
import {
	CreateEventCommand,
	CreateInitEventCommand,
	CreateOrUpdateStageCommand,
	TruncateEventsCommand,
	TruncateStagesCommand,
} from './commands'
import { formatSchemaName, getJunctionTables } from './helpers'
import { Schema } from '@contember/schema'
import { wrapIdentifier } from '@contember/database'
import assert from 'assert'
import { EventType } from '@contember/engine-common'

function notStrictEqual<T, E>(actual: T, expected: E, message?: string | Error): asserts actual is Exclude<T, E> {
	assert.notStrictEqual(actual, expected, message)
}

export class ProjectTruncateExecutor {
	constructor(private readonly executedMigrationsResolver: ExecutedMigrationsResolver) {}

	public async truncateProject(db: DatabaseContext, project: ProjectConfig, schema: Schema) {
		await db.transaction(async trx => {
			const migrations = await this.executedMigrationsResolver.getMigrations(trx)
			await trx.client.query('SET CONSTRAINTS ALL DEFERRED')
			const tableNames = Object.values(schema.model.entities).map(it => it.tableName)
			const junctionTableNames = getJunctionTables(schema.model).map(it => it.tableName)
			const allTableNames = [...tableNames, ...junctionTableNames]
			for (const stage of project.stages) {
				const schemaName = formatSchemaName(stage)
				const wrappedNames = allTableNames.map(it => `${wrapIdentifier(schemaName)}.${wrapIdentifier(it)}`)
				await trx.client.query(`TRUNCATE ${wrappedNames}`)
			}
			await trx.client.query('SET CONSTRAINTS ALL IMMEDIATE')
			await trx.commandBus.execute(new TruncateStagesCommand())
			await trx.commandBus.execute(new TruncateEventsCommand())
			const initEventId = await trx.commandBus.execute(new CreateInitEventCommand())
			notStrictEqual(initEventId, null)
			let previousId = initEventId
			for (const migration of migrations) {
				previousId = await trx.commandBus.execute(
					new CreateEventCommand(
						EventType.runMigration,
						{
							version: migration.version,
						},
						previousId,
					),
				)
			}
			for (const stage of project.stages) {
				const stageCreateResult = await trx.commandBus.execute(new CreateOrUpdateStageCommand(stage, previousId))
				assert.strictEqual(stageCreateResult, true)
			}
		})
	}
}
