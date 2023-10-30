import { ChangeMyProfileResponse, MutationChangeMyProfileArgs, MutationResolvers } from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PermissionActions, PersonManager, PersonQuery } from '../../../model'
import { createErrorResponse } from '../../errorUtils'

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
		if (!person) {
			return createErrorResponse('NOT_A_PERSON', 'Only a person can change a profile.')
		}
		if (args.email === null) {
			return createErrorResponse('INVALID_EMAIL_FORMAT', 'E-mail address cannot be null.')
		}

		await context.requireAccess({
			action: PermissionActions.PERSON_CHANGE_MY_PROFILE,
			message: 'You are not allowed to change profile',
		})

		const result = await this.personManager.changeMyProfile(context.db, person, {
			email: args.email,
			name: args.name === '' ? null : args.name,
		})

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return { ok: true }
	}
}
