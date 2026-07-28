import { MailTemplateData, QueryResolvers } from '../../schema/index.js'
import { MailTemplateListQuery, mailTypeFromDbToSchema, PermissionActions } from '../../model/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'

export class MailTemplateQueryResolver implements QueryResolvers {
	/** Filters per row rather than throwing, like the other tenant read fields. */
	async mailTemplates(parent: unknown, args: unknown, context: TenantResolverContext): Promise<MailTemplateData[]> {
		const rows = await context.db.queryHandler.fetch(new MailTemplateListQuery())
		const visible = await Promise.all(rows.map(async row => {
			const type = mailTypeFromDbToSchema(row.type)
			const allowed = await context.isAllowed({
				action: PermissionActions.MAIL_TEMPLATE_LIST({
					kind: row.projectSlug === null ? 'global' : 'project',
					projectSlug: row.projectSlug,
					type,
				}),
			})
			return allowed ? { ...row, variant: row.variant || null, type } : null
		}))
		return visible.filter(row => row !== null)
	}
}
