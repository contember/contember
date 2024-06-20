import { ExpectedQuery } from '@contember/database-tester'

export const getMailTemplateSql = (
	args: { type: string; projectId: string | null },
): ExpectedQuery => args.projectId ? {
	sql: `select "mail_template"."id", "subject", "content", "use_layout" as "useLayout", "reply_to" as "replyTo", "project_id" as "projectId", "mail_type" as "type", "variant"
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
		sql: `select "mail_template"."id", "subject", "content", "use_layout" as "useLayout", "reply_to" as "replyTo", "project_id" as "projectId", "mail_type" as "type", "variant"
			  FROM "tenant"."mail_template"
			  WHERE "project_id" IS NULL
				AND "mail_type" = ?
				AND "variant" = ?`,
		parameters: [args.type, ''],
		response: {
			rows: [],
		},
	}
