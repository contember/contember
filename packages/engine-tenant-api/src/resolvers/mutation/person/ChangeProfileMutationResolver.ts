import {
	ChangeMyProfileResponse,
	ChangeProfileResponse,
	ConfirmEmailChangeResponse,
	MutationChangeMyProfileArgs,
	MutationChangeProfileArgs,
	MutationConfirmEmailChangeArgs,
	MutationResolvers,
} from '../../../schema/index.js'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import {
	ConfigurationQuery,
	EmailChangeManager,
	IdentityScope,
	PermissionActions,
	PermissionContextFactory,
	PersonManager,
	PersonQuery,
} from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { ResponseOk } from '../../../model/utils/Response.js'
import { normalizeEmail } from '../../../model/utils/email.js'

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
		// Compare normalized: a resubmit that only differs in casing/whitespace is
		// not a real change and must not trigger a confirmation mail.
		const normalizedNewEmail = args.email ? normalizeEmail(args.email) : null
		const emailChanging = normalizedNewEmail !== null && normalizedNewEmail !== person.email

		// When e-mail-change verification is required, an e-mail change is not
		// applied immediately: it goes through confirmEmailChange against a token
		// mailed to the new address (the old address stays active until then). The
		// name change (if any) is applied atomically with the token —
		// validation/rate-limiting run first, so a rejected e-mail never leaves a
		// half-applied profile. This is governed by its own config flag,
		// independent of signup verification.
		if (emailChanging && config.emailChange.requireVerification) {
			const permissionContext = await this.permissionContextFactory.create(context.db, {
				id: person.identity_id,
				roles: person.roles,
			})
			const result = await this.emailChangeManager.requestEmailChange(
				context.db,
				permissionContext,
				person,
				normalizedNewEmail,
				{},
				args.name !== undefined
					? async db => {
						await this.personManager.changeProfile(db, person, { name: args.name === '' ? null : args.name })
					}
					: undefined,
			)
			await context.logAuthAction({
				type: 'email_change_init',
				response: result,
				personId: person.id,
				// Log the normalized address so it matches the per-recipient backoff key.
				personInput: normalizedNewEmail,
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
