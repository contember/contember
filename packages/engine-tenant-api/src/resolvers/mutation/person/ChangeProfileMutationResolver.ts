import {
	ChangeMyProfileResponse,
	MutationChangeMyProfileArgs,
	MutationResolvers,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PersonManager, PermissionActions, PersonQuery } from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { validateEmail } from '../../../model/utils/email'

export class ChangeProfileMutationResolver implements MutationResolvers {
	constructor(
		private readonly personManager: PersonManager,
	) { }

	async changeMyProfile(
		parent: unknown,
		args: MutationChangeMyProfileArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ChangeMyProfileResponse> {
		const person = await context.db.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))
		let name: string | null | undefined = undefined
		if (args !== undefined) {
			if (args.name === null || args.name === '') {
				name = null
			} else {
				name = args.name
			}
		}

		if (!person) {
			return createErrorResponse('NOT_A_PERSON', 'Only a person can change a password')
		}
		if (args.email !== undefined && (args.email === null || !validateEmail(args.email.trim()))) {
			return createErrorResponse('INVALID_EMAIL_FORMAT', 'E-mail address is not in a valid format')
		}

		await context.requireAccess({
			action: PermissionActions.PERSON_CHANGE_MY_PROFILE,
			message: 'You are not allowed to change profile',
		})
		await this.personManager.changeMyProfile(context.db, person, args.email, name)

		return { ok: true }
	}
}
