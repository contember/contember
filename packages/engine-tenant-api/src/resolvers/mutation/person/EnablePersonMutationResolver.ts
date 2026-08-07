import { EnablePersonResponse, MutationEnablePersonArgs, MutationResolvers } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { PermissionActions, PersonAccessManager } from '../../../model/index.js'
import { PersonManager } from '../../../model/service/PersonManager.js'
import { createErrorResponse } from '../../errorUtils.js'

export class EnablePersonMutationResolver implements MutationResolvers {
	constructor(
		private readonly personAccessManager: PersonAccessManager,
		private readonly personManager: PersonManager,
	) {}

	async enablePerson(
		parent: unknown,
		args: MutationEnablePersonArgs,
		context: TenantResolverContext,
	): Promise<EnablePersonResponse> {
		const targetPerson = await this.personManager.findPersonById(context.db, args.personId)

		if (targetPerson === null) {
			return {
				ok: false,
				error: {
					code: 'PERSON_NOT_FOUND',
					developerMessage: `Person <${args.personId}> was not found`,
				},
			}
		}

		// Enabling is the inverse of disabling, so it is the same privilege — a separate resource/privilege pair would need an ACL change everywhere.
		await context.requireAccess({
			action: PermissionActions.PERSON_DISABLE(targetPerson.roles),
			message: 'You are not allowed to enable person account',
		})

		const result = await this.personAccessManager.enablePerson(context.db, targetPerson)
		await context.logAuthAction({
			type: 'person_enable',
			response: result,
			targetPersonId: targetPerson.id,
		})
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return {
			ok: true,
		}
	}
}
