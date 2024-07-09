import {
	ChangeMyProfileResponse,
	ChangeProfileResponse,
	MutationChangeMyProfileArgs,
	MutationChangeProfileArgs,
	MutationResolvers,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext'
import { IdentityScope, PermissionActions, PersonManager, PersonQuery } from '../../../model'
import { createErrorResponse } from '../../errorUtils'

export class ChangeProfileMutationResolver implements Pick<MutationResolvers, 'changeMyProfile' | 'changeProfile'> {
	constructor(
		private readonly personManager: PersonManager,
	) { }

	async changeProfile(
		parent: unknown,
		args: MutationChangeProfileArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ChangeProfileResponse> {
		const person = await context.db.queryHandler.fetch(PersonQuery.byId(args.personId))
		if (!person) {
			return createErrorResponse('PERSON_NOT_FOUND', 'Person not found')
		}
		if (args.email === null) {
			return createErrorResponse('INVALID_EMAIL_FORMAT', 'E-mail address cannot be null.')
		}

		await context.requireAccess({
			scope: new IdentityScope(person.identity_id),
			action: PermissionActions.PERSON_CHANGE_PROFILE,
			message: 'You are not allowed to change a profile',
		})
		const result = await this.personManager.changeProfile(context.db, person, {
			email: args.email,
			name: args.name === '' ? null : args.name,
		})

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return { ok: true }
	}


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

		const result = await this.personManager.changeProfile(context.db, person, {
			email: args.email,
			name: args.name === '' ? null : args.name,
		})

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return { ok: true }
	}
}
