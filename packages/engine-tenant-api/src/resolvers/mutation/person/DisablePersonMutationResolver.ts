import {
	DisablePersonErrorCode,
	DisablePersonResponse,
	MutationDisablePersonArgs,
	MutationResolvers,
} from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PersonAccessManager, PersonDisableAccessErrorCode } from '../../../model'

export class DisablePersonMutationResolver implements MutationResolvers {
	constructor(private readonly personAccessManager: PersonAccessManager) {}

	async disablePerson(
		parent: any, args: MutationDisablePersonArgs, context: TenantResolverContext,
	): Promise<DisablePersonResponse> {
		// TODO: Add permission resolver
		const resultError = await this.personAccessManager.disablePerson(context.db, args.personId)

		// Person disabled without any issues
		if (resultError === null) {
			return { ok: true }
		}


		return {
			ok: false,
			error: {
				code: DisablePersonErrorCode.PersonAlreadyDisabled,
				developerMessage: `Person <${args.personId}> already disabled`,
			},
		}

		/*
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
		}*/
	}
}
