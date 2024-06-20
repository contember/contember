import { MailTemplateData, QueryResolvers } from '../../schema'
import { MailTemplateListQuery, MailTemplateManager, mailTypeFromDbToSchema, PermissionActions } from '../../model'
import { TenantResolverContext } from '../TenantResolverContext'

export class MailTemplateQueryResolver implements QueryResolvers {

	constructor(
		private readonly mailTemplateManager: MailTemplateManager,
	) {
	}

	async mailTemplates(parent: unknown, args: unknown, context: TenantResolverContext): Promise<MailTemplateData[]> {
		await context.requireAccess({
			action: PermissionActions.IDP_LIST,
			message: 'You are not allowed to list IDP',
		})
		return (await context.db.queryHandler.fetch(new MailTemplateListQuery())).map(it => ({
			...it,
			variant: it.variant || null,
			type: mailTypeFromDbToSchema(it.type),
		}))
	}
}
