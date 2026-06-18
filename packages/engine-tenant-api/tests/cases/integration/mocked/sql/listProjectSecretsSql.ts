import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

export interface ProjectSecretResponseRow {
	key: string
	createdAt: Date
	updatedAt: Date
}

export const listProjectSecretsSql = (args: { projectId: string; rows: ProjectSecretResponseRow[] }): ExpectedQuery => ({
	sql: SQL`select "key", "created_at", "updated_at"
		from "tenant"."project_secret"
		where "project_id" = ?
		order by "key" asc`,
	parameters: [args.projectId],
	response: {
		rows: args.rows.map(row => ({
			key: row.key,
			created_at: row.createdAt,
			updated_at: row.updatedAt,
		})),
	},
})
