import { DatabaseContext } from './database'
import { ProjectConfig } from '../types'
import { TruncateEventsCommand } from './commands'
import { getJunctionTables } from './helpers'
import { Schema } from '@contember/schema'
import { wrapIdentifier } from '@contember/database'
import { StagesQuery } from './queries'

export class ProjectTruncateExecutor {
	public async truncateProject(db: DatabaseContext, project: ProjectConfig, schema: Schema) {
		const tableNames = Object.values(schema.model.entities).filter(it => !it.view).map(it => it.tableName)
		const junctionTableNames = getJunctionTables(schema.model).map(it => it.tableName)
		const allTableNames = [...tableNames, ...junctionTableNames]
		if (allTableNames.length === 0) {
			return
		}
		await db.transaction(async trx => {
			await trx.client.query('SET CONSTRAINTS ALL DEFERRED')
			const stages = await db.queryHandler.fetch(new StagesQuery())
			for (const stage of stages) {
				const wrappedNames = allTableNames.map(it => `${wrapIdentifier(stage.schema)}.${wrapIdentifier(it)}`)
				await trx.client.query(`TRUNCATE ${wrappedNames}`)
			}
			await trx.client.query('SET CONSTRAINTS ALL IMMEDIATE')
			await trx.commandBus.execute(new TruncateEventsCommand())
		})
	}
}
