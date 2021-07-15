import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'
import { Project } from '../../../../../src'

export const getProjectBySlugSql = (args: { projectSlug: string; response: Project }): ExpectedQuery => ({
	sql: SQL`SELECT "id", "name", "slug"
	         FROM "tenant"."project"
	         WHERE "slug" = ?`,
	parameters: [args.projectSlug],
	response: {
		rows: args.response ? [args.response] : [],
	},
})
