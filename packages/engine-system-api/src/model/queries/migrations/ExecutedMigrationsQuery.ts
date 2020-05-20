import { DatabaseQuery, DatabaseQueryable, Operator } from '@contember/database'
import { ExecutedMigration } from '../../dtos'
import { createExecutedMigrationDto, createExecutedMigrationQueryBuilder } from './ExecutedMigrationsQueryHelper'

export class ExecutedMigrationsQuery extends DatabaseQuery<ExecutedMigration[]> {
	constructor(private afterVersion?: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<ExecutedMigration[]> {
		const builder = createExecutedMigrationQueryBuilder()
		const builderWithWhere = this.afterVersion
			? builder.where(expr => expr.compare('version', Operator.gt, this.afterVersion!))
			: builder

		const result = await builderWithWhere.getResult(queryable.db)
		return result.map(createExecutedMigrationDto)
	}
}
