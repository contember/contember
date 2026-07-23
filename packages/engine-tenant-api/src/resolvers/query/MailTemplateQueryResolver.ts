import { MailTemplateData, QueryResolvers } from '../../schema/index.js'
import { MailTemplateListQuery, mailTypeFromDbToSchema, PermissionActions } from '../../model/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'

export class MailTemplateQueryResolver implements QueryResolvers {
	async mailTemplates(parent: unknown, args: unknown, context: TenantResolverContext): Promise<MailTemplateData[]> {
		await context.requireAccess({
			action: PermissionActions.MAIL_TEMPLATE_LIST({ kind: 'any' }),
			message: 'You are not allowed to list mail templates',
		})
		const rows = await context.db.queryHandler.fetch(new MailTemplateListQuery())
		const visibleRows = await Promise.all(rows.map(async row => {
			const type = mailTypeFromDbToSchema(row.type)
			const allowed = await context.permissionContext.isAllowed({
				action: PermissionActions.MAIL_TEMPLATE_LIST({
					kind: row.projectSlug === null ? 'global' : 'project',
					projectSlug: row.projectSlug,
					type,
				}),
			})
			return allowed ? { row, type } : null
		}))
		return visibleRows.flatMap(item =>
			item === null
				? []
				: [{
					...item.row,
					variant: item.row.variant || null,
					type: item.type,
				}]
		)
	}
}
