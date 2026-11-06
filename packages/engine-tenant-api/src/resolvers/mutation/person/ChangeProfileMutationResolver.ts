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
	createPersonPermissionTarget,
	EmailChangeManager,
	IdentityScope,
	PermissionActions,
	PermissionContextFactory,
	PersonManager,
	PersonQuery,
	ProfileField,
	ReauthenticationVerifier,
	RevokePersonSessionsCommand,
} from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { EmailAddress } from '../../../model/utils/email.js'

export class ChangeProfileMutationResolver implements Pick<MutationResolvers, 'changeMyProfile' | 'changeProfile' | 'confirmEmailChange'> {
	constructor(
		private readonly personManager: PersonManager,
		private readonly emailChangeManager: EmailChangeManager,
		private readonly permissionContextFactory: PermissionContextFactory,
		private readonly reauthenticationVerifier: ReauthenticationVerifier,
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

		const fields: ProfileField[] = [
			...(args.name !== undefined ? ['name' as const] : []),
			...(args.email !== undefined ? ['email' as const] : []),
		]
		await context.requireAccess({
			scope: new IdentityScope(person.identity_id),
			action: PermissionActions.PERSON_CHANGE_PROFILE(await createPersonPermissionTarget(context.db, person), fields),
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
		const newEmail = args.email ? EmailAddress.parse(args.email) : null
		if (args.email && newEmail === null) {
			return createErrorResponse('INVALID_EMAIL_FORMAT', 'E-mail address is not in a valid format')
		}
		// Compare normalized: a resubmit that only differs in casing is not a real change
		// and must not trigger a confirmation mail.
		const normalizedNewEmail = newEmail?.normalized() ?? null
		const emailChanging = normalizedNewEmail !== null && normalizedNewEmail.value !== person.email

		// Opt-in: a stolen session alone must not be enough to move the account to another address.
		const requireReauthentication = emailChanging && config.emailChange.requireReauthentication
		if (requireReauthentication) {
			const reauthentication = await this.reauthenticationVerifier.verify(context.db, person, {
				currentPassword: args.currentPassword,
				otpToken: args.otpToken,
			})
			if (!reauthentication.ok) {
				await context.logAuthAction({
					type: 'email_change',
					response: reauthentication,
					personId: person.id,
				})
				return createErrorResponse(reauthentication.error, reauthentication.errorMessage)
			}
		}

		// When e-mail-change verification applies, an e-mail change is not
		// applied immediately: it goes through confirmEmailChange against a token
		// mailed to the new address (the old address stays active until then). The
		// name change (if any) is applied atomically with the token —
		// validation/rate-limiting run first, so a rejected e-mail never leaves a
		// half-applied profile.
		//
		// This fires when EITHER the tenant opts in via require_email_change_verification,
		// OR this account is already subject to verification (email_verification_required,
		// set when it signed up while signup verification was on). The latter is what
		// keeps the "email_verified_at implies THIS address was proven" invariant intact:
		// without it, a verification-required account could swap to an arbitrary address
		// via the direct path and inherit the old verified status, defeating the sign-in
		// gate. signup verification ⇒ change verification, regardless of the change flag.
		if (emailChanging && (config.emailChange.requireVerification || person.email_verification_required)) {
			const permissionContext = this.permissionContextFactory.create(context.db, {
				id: person.identity_id,
				roles: person.roles,
			}, context.permissionContext.authorizator)
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
				personInput: normalizedNewEmail.value,
			})
			if (!result.ok) {
				return createErrorResponse(result.error, result.errorMessage)
			}
			return { ok: true }
		}

		const profileChange = { email: newEmail?.value ?? args.email, name: args.name === '' ? null : args.name }
		const result = requireReauthentication
			? await context.db.transaction(async db => {
				const changed = await this.personManager.changeProfile(db, person, profileChange)
				if (changed.ok) {
					await db.commandBus.execute(new RevokePersonSessionsCommand(person.id, context.apiKeyId))
				}
				return changed
			})
			: await this.personManager.changeProfile(context.db, person, profileChange)
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
		if (requireReauthentication && normalizedNewEmail !== null) {
			await this.emailChangeManager.notifyOldAddress(context.db, person, normalizedNewEmail.value)
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
			// personId/tokenId ride along in the AuthLog bag on both success and
			// the uniqueness/validation failure paths (see EmailChangeManager).
			response: result,
		})
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}
		return { ok: true }
	}
}
