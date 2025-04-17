import { MutationResolvers, ToggleMyPasswordlessResponse } from '../../../schema'
import { ConfigurationManager } from '../../../model/service/ConfigurationManager'
import { TenantResolverContext } from '../../TenantResolverContext'
import { ConfigurationQuery, PermissionActions, PersonManager, PersonQuery } from '../../../model'
import { createErrorResponse } from '../../errorUtils'

export class TogglePasswordlessMutationResolver implements Pick<MutationResolvers, 'enableMyPasswordless' | 'disableMyPasswordless'> {
	constructor(
		private readonly configurationManager: ConfigurationManager,
		private readonly personManager: PersonManager,
	) {
	}

	async enableMyPasswordless(parent: unknown, args: unknown, context: TenantResolverContext): Promise<ToggleMyPasswordlessResponse> {
		return this.doTogglePasswordless(context, true)
	}

	async disableMyPasswordless(parent: unknown, args: unknown, context: TenantResolverContext): Promise<ToggleMyPasswordlessResponse> {
		return this.doTogglePasswordless(context, false)
	}

	private async doTogglePasswordless(
		context: TenantResolverContext,
		value: boolean,
	): Promise<ToggleMyPasswordlessResponse> {
		const person = await context.db.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))
		if (!person) {
			return createErrorResponse('NOT_A_PERSON', 'Only a person can change a password')
		}
		await context.requireAccess({
			action: PermissionActions.PERSON_TOGGLE_PASSWORDLESS,
			message: 'You are not allowed to enable passwordless',
		})
		const config = await await context.db.queryHandler.fetch(new ConfigurationQuery())
		if (config.passwordless?.enabled === 'always' || config.passwordless?.enabled === 'never') {
			return createErrorResponse('CANNOT_TOGGLE', 'Passwordless is configured globally and cannot be toggled')
		}

		await this.personManager.togglePasswordless(context.db, person, value)

		return { ok: true }
	}

}
