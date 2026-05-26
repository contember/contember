import {
	ChangeMyProfileResponse,
	ChangeProfileResponse,
	ConfirmEmailChangeResponse,
	MutationChangeMyProfileArgs,
	MutationChangeProfileArgs,
	MutationConfirmEmailChangeArgs,
	MutationResolvers,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext'
import {
	ConfigurationQuery,
	EmailChangeManager,
	IdentityScope,
	PermissionActions,
	PermissionContextFactory,
	PersonManager,
	PersonQuery,
} from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { ResponseOk } from '../../../model/utils/Response'

export class ChangeProfileMutationResolver implements Pick<MutationResolvers, 'changeMyProfile' | 'changeProfile' | 'confirmEmailChange'> {
	constructor(
		private readonly personManager: PersonManager,
		private readonly emailChangeManager: EmailChangeManager,
		private readonly permissionContextFactory: PermissionContextFactory,
	) {}

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
			action: PermissionActions.PERSON_CHANGE_PROFILE(person.roles),
			message: 'You are not allowed to change a profile',
		})
		const result = await this.personManager.changeProfile(context.db, person, {
			email: args.email,
			name: args.name === '' ? null : args.name,
		})
		if (args.email) {
			await context.logAuthAction({
				type: 'email_change',
				response: result,
			})
		}

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

		const config = await context.db.queryHandler.fetch(new ConfigurationQuery(context.db.providers))
		const emailChanging = !!args.email && args.email !== person.email

		// When verification is required, an e-mail change is not applied
		// immediately: it goes through confirmEmailChange against a token mailed
		// to the new address. The name change (if any) still applies right away.
		if (emailChanging && config.signup.requireEmailVerification) {
			if (args.name !== undefined) {
				const nameResult = await this.personManager.changeProfile(context.db, person, {
					name: args.name === '' ? null : args.name,
				})
				if (!nameResult.ok) {
					return createErrorResponse(nameResult.error, nameResult.errorMessage)
				}
			}
			const permissionContext = await this.permissionContextFactory.create(context.db, {
				id: person.identity_id,
				roles: person.roles,
			})
			const result = await this.emailChangeManager.requestEmailChange(context.db, permissionContext, person, args.email!)
			await context.logAuthAction({
				type: 'email_change_init',
				response: result,
				personId: person.id,
				personInput: args.email!,
			})
			if (!result.ok) {
				return createErrorResponse(result.error, result.errorMessage)
			}
			return { ok: true }
		}

		const result = await this.personManager.changeProfile(context.db, person, {
			email: args.email,
			name: args.name === '' ? null : args.name,
		})
		if (args.email) {
			await context.logAuthAction({
				type: 'email_change',
				response: result,
				personId: person.id,
			})
		}

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return { ok: true }
	}

	async confirmEmailChange(
		parent: unknown,
		args: MutationConfirmEmailChangeArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ConfirmEmailChangeResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_RESET_PASSWORD,
			message: 'You are not allowed to confirm an e-mail change',
		})

		const result = await this.emailChangeManager.confirmEmailChange(context.db, args.token)
		await context.logAuthAction({
			type: 'email_change_complete',
			// confirmEmailChange's success payload carries domain data, not an
			// AuthLog bag; collapse to a bare ok/error for the audit entry.
			response: result.ok ? new ResponseOk(null) : result,
			personId: result.ok ? result.result.personId : undefined,
		})
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}
		return { ok: true }
	}
}
