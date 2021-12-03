import { ExpectedQuery } from '@contember/database-tester'

export const getMailTemplateSql = (
	args: { type: string; projectId: string | null },
): ExpectedQuery => args.projectId ? {
	sql: `SELECT "id", "subject", "content", "use_layout" AS "uselayout"
			  FROM "tenant"."mail_template"
			  WHERE "project_id" = ?
				AND "mail_type" = ?
				AND "variant" = ?`,
	parameters: [args.projectId, args.type, ''],
	response: {
		rows: [],
	},
} :
	{
		sql: `SELECT "id", "subject", "content", "use_layout" AS "uselayout"
			  FROM "tenant"."mail_template"
			  WHERE "project_id" IS NULL
				AND "mail_type" = ?
				AND "variant" = ?`,
		parameters: [args.type, ''],
		response: {
			rows: [],
		},
	}
