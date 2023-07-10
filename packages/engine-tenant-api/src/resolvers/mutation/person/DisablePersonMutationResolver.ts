import {
	DisablePersonResponse,
	MutationDisablePersonArgs,
	MutationResolvers,
} from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PermissionActions, PersonAccessManager } from '../../../model'
import { PersonManager } from '../../../model/service/PersonManager'
import { createErrorResponse } from '../../errorUtils'

export class DisablePersonMutationResolver implements MutationResolvers {

	constructor(
		private readonly personAccessManager: PersonAccessManager,
		private readonly personManager: PersonManager,
	) {}

	async disablePerson(
		parent: any, args: MutationDisablePersonArgs, context: TenantResolverContext,
	): Promise<DisablePersonResponse> {
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

		await context.requireAccess({
			action: PermissionActions.PERSON_DISABLE(targetPerson.roles),
			message: 'You are not allowed to disable person account',
		})

		const result = await this.personAccessManager.disablePerson(context.db, args.personId)

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return {
			ok: true,
		}
	}
}
