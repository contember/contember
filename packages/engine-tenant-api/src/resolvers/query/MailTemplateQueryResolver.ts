import { MailTemplateData, QueryResolvers } from '../../schema/index.js'
import { MailTemplateListQuery, mailTypeFromDbToSchema, PermissionActions } from '../../model/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'

export class MailTemplateQueryResolver implements QueryResolvers {
	async mailTemplates(parent: unknown, args: unknown, context: TenantResolverContext): Promise<MailTemplateData[]> {
		await context.requireAccess({
			action: PermissionActions.MAIL_TEMPLATE_LIST,
			message: 'You are not allowed to list mail templates',
		})
		return (await context.db.queryHandler.fetch(new MailTemplateListQuery())).map(it => ({
			...it,
			variant: it.variant || null,
			type: mailTypeFromDbToSchema(it.type),
		}))
	}
}
