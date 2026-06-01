import { DatabaseQuery, DatabaseQueryable, Operator } from '@contember/database'
import { ExecutedMigration } from '../../dtos/index.js'
import { createExecutedMigrationDto, createExecutedMigrationQueryBuilder } from './ExecutedMigrationsQueryHelper.js'

export class ExecutedMigrationsQuery extends DatabaseQuery<ExecutedMigration[]> {
	constructor(private afterVersion?: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<ExecutedMigration[]> {
		const builder = createExecutedMigrationQueryBuilder()
		const afterVersion = this.afterVersion
		const builderWithWhere = afterVersion
			? builder.where(expr => expr.compare('version', Operator.gt, afterVersion))
			: builder

		const result = await builderWithWhere.getResult(queryable.db)
		return result.map(createExecutedMigrationDto)
	}
}
