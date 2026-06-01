import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'
import { Project } from '../../../../../src/index.js'

export const getProjectBySlugSql = (args: { projectSlug: string; response: Project }): ExpectedQuery => ({
	sql: SQL`select "id", "name", "slug", "config", "updated_at" as "updatedAt"
	         FROM "tenant"."project"
	         WHERE "slug" = ?`,
	parameters: [args.projectSlug],
	response: {
		rows: args.response ? [args.response] : [],
	},
})
