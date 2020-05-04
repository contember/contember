import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'
import { ProjectBySlugQuery } from '../../../../../src/model/queries'

export const getProjectBySlugSql = (args: {
	projectSlug: string
	response: ProjectBySlugQuery.Result
}): ExpectedQuery => ({
	sql: SQL`SELECT "id", "name", "slug"
	         FROM "tenant"."project"
	         WHERE "slug" = ?`,
	parameters: [args.projectSlug],
	response: {
		rows: args.response ? [args.response] : [],
	},
})
