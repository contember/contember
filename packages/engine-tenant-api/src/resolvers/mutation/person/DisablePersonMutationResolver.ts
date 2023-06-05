import {
	DisablePersonErrorCode,
	DisablePersonResponse,
	MutationDisablePersonArgs,
	MutationResolvers,
} from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PermissionActions, PersonAccessManager, PersonDisableAccessErrorCode } from '../../../model'
import { PersonManager } from '../../../model/service/PersonManager'

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
					code: DisablePersonErrorCode.PersonNotFound,
					developerMessage: `Person <${args.personId}> was not found`,
				},
			}
		}

		await context.requireAccess({
			action: PermissionActions.PERSON_DISABLE(targetPerson.roles),
			message: 'You are not allowed to disable person account',
		})

		const resultError = await this.personAccessManager.disablePerson(context.db, args.personId)

		// Person disabled without any issues
		if (resultError === null) {
			return { ok: true }
		}

		return {
			ok: false,
			error: {
				code: DisablePersonErrorCode.PersonAlreadyDisabled,
				developerMessage: `Person <${args.personId}> already disabled.`,
			},
		}
	}
}
