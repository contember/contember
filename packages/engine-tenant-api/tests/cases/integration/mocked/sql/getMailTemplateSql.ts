import { ExpectedQuery } from '@contember/database-tester'

/** `storedSubject` makes the lookup find a stored template with that subject; otherwise it finds none. */
export const getMailTemplateSql = (
	args: { type: string; projectId: string | null; storedSubject?: string },
): ExpectedQuery => ({
	...getMailTemplateQuery(args),
	response: {
		rows: args.storedSubject === undefined ? [] : [{
			id: 'stored-template',
			subject: args.storedSubject,
			content: 'Stored template {{token}}',
			useLayout: false,
			replyTo: null,
			projectId: args.projectId,
			type: args.type,
			variant: '',
		}],
	},
})

const getMailTemplateQuery = (args: { type: string; projectId: string | null }): Omit<ExpectedQuery, 'response'> =>
	args.projectId
		? {
			sql:
				`select "mail_template"."id", "subject", "content", "use_layout" as "useLayout", "reply_to" as "replyTo", "project_id" as "projectId", "mail_type" as "type", "variant"
			  FROM "tenant"."mail_template"
			  WHERE "project_id" = ?
				AND "mail_type" = ?
				AND "variant" = ?`,
			parameters: [args.projectId, args.type, ''],
		}
		: {
			sql:
				`select "mail_template"."id", "subject", "content", "use_layout" as "useLayout", "reply_to" as "replyTo", "project_id" as "projectId", "mail_type" as "type", "variant"
			  FROM "tenant"."mail_template"
			  WHERE "project_id" IS NULL
				AND "mail_type" = ?
				AND "variant" = ?`,
			parameters: [args.type, ''],
		}
