import {
	ConfirmOtpResponse,
	DisableOtpResponse,
	MutationConfirmOtpArgs,
	MutationDisableOtpArgs,
	MutationPrepareOtpArgs,
	MutationResolvers,
	PrepareOtpResponse,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import {
	AuthPolicyResolver,
	BackupCodeManager,
	OtpManager,
	PermissionActions,
	PersonQuery,
	PersonRow,
	ReauthenticationVerifier,
} from '../../../model/index.js'
import { ImplementationException } from '../../../exceptions.js'
import { createErrorResponse } from '../../errorUtils.js'
import { ResponseError, ResponseOk } from '../../../model/utils/Response.js'

export class OtpMutationResolver implements MutationResolvers {
	constructor(
		private readonly otpManager: OtpManager,
		private readonly backupCodeManager: BackupCodeManager,
		private readonly authPolicyResolver: AuthPolicyResolver,
		private readonly reauthenticationVerifier: ReauthenticationVerifier,
	) {}

	async prepareOtp(parent: any, args: MutationPrepareOtpArgs, context: TenantResolverContext): Promise<PrepareOtpResponse> {
		const person = await this.getPersonFromContext(context)
		// Preparing while TOTP is active rotates it; enrolling a first TOTP needs no re-authentication.
		if (person.otp_activated_at) {
			const reauthentication = await this.reauthenticationVerifier.verifyMfaChange(context.db, person, args)
			if (!reauthentication.ok) {
				await context.logAuthAction({ type: '2fa_enable', response: reauthentication, personId: person.id })
				return createErrorResponse(reauthentication)
			}
		}
		const otp = await this.otpManager.prepareOtp(context.db, person, args.label || 'Contember')
		return {
			ok: true,
			result: {
				otpUri: otp.uri,
				otpSecret: otp.secret,
			},
		}
	}

	async confirmOtp(parent: any, args: MutationConfirmOtpArgs, context: TenantResolverContext): Promise<ConfirmOtpResponse> {
		const person = await this.getPersonFromContext(context)
		if (!person.otp_pending_secret) {
			return createErrorResponse(
				'NOT_PREPARED',
				`OTP setup was not initialized. Call prepareOtp first.`,
			)
		}
		if (!await this.otpManager.verifyPendingOtp(person, args.otpToken)) {
			const responseError = new ResponseError('INVALID_OTP_TOKEN', 'Provided token is not correct.')
			await context.logAuthAction({
				type: '2fa_enable',
				response: responseError,
				personId: person.id,
			})
			return createErrorResponse(responseError)
		}
		await this.otpManager.confirmOtp(context.db, person)
		await context.logAuthAction({
			type: '2fa_enable',
			response: new ResponseOk(null),
			personId: person.id,
		})
		// Promoting pending->active enrolls (or rotates) TOTP; (re)issue the backup-code set.
		const backupCodes = await this.backupCodeManager.generate(context.db, person.id)
		await context.logAuthAction({
			type: 'backup_code_generated',
			response: new ResponseOk(null),
			personId: person.id,
		})
		return {
			ok: true,
			errors: [],
			result: {
				backupCodes,
			},
		}
	}

	async disableOtp(parent: any, args: MutationDisableOtpArgs, context: TenantResolverContext): Promise<DisableOtpResponse> {
		const person = await this.getPersonFromContext(context)
		if (!person.otp_secret) {
			return createErrorResponse('OTP_NOT_ACTIVE', 'OTP is not active, you cannot disable it.')
		}
		// Block removal of the last factor when an effective policy mandates MFA.
		// Rotation (prepareOtp + confirmOtp) stays open — only removal is blocked.
		const wouldHaveNoFactor = !person.email_otp_enabled
		if (wouldHaveNoFactor) {
			const policy = await this.authPolicyResolver.resolveForIdentity(context.db, person.identity_id, person.roles)
			if (policy.mfaRequired) {
				return createErrorResponse('MFA_REQUIRED', 'MFA is required for your role; you cannot disable your only factor.')
			}
		}
		const reauthentication = await this.reauthenticationVerifier.verifyMfaChange(context.db, person, args)
		if (!reauthentication.ok) {
			await context.logAuthAction({ type: '2fa_disable', response: reauthentication, personId: person.id })
			return createErrorResponse(reauthentication)
		}
		await this.otpManager.disableOtp(context.db, person)
		await this.backupCodeManager.deleteForPerson(context.db, person.id)
		await context.logAuthAction({
			type: '2fa_disable',
			response: new ResponseOk(null),
			personId: person.id,
		})
		return {
			ok: true,
			errors: [],
		}
	}

	private async getPersonFromContext(context: TenantResolverContext): Promise<PersonRow> {
		await context.requireAccess({
			action: PermissionActions.PERSON_SETUP_OTP,
			message: 'You are not allowed to setup a OTP',
		})
		const person = await context.db.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))
		if (!person) {
			throw new ImplementationException('Person should exists')
		}

		return person
	}
}
