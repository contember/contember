import {
	DisablePersonErrorCode,
	DisablePersonResponse,
	MutationDisablePersonArgs,
	MutationResolvers,
} from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PermissionActions, PersonAccessManager, PersonDisableAccessErrorCode } from '../../../model'

export class DisablePersonMutationResolver implements MutationResolvers {
	constructor(private readonly personAccessManager: PersonAccessManager) {}

	async disablePerson(
		parent: any, args: MutationDisablePersonArgs, context: TenantResolverContext,
	): Promise<DisablePersonResponse> {

		await context.requireAccess({
			action: PermissionActions.PERSON_DISABLE,
			message: 'You are not allowed to disable person account',
		})

		const resultError = await this.personAccessManager.disablePerson(context.db, args.personId)

		// Person disabled without any issues
		if (resultError === null) {
			return { ok: true }
		}

		switch (resultError) {
			case PersonDisableAccessErrorCode.PERSON_ALREADY_DISABLED:
				return {
					ok: false,
					error: {
						code: DisablePersonErrorCode.PersonAlreadyDisabled,
						developerMessage: `Person <${args.personId}> already disabled`,
					},
				}

			case PersonDisableAccessErrorCode.PERSON_NOT_FOUND:
				return {
					ok: false,
					error: {
						code: DisablePersonErrorCode.PersonNotFound,
						developerMessage: `Person <${args.personId}> was not found`,
					},
				}
		}
	}
}
