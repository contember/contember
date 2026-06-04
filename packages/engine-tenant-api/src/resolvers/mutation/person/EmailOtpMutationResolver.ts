import {
	ConfirmEmailOtpResponse,
	DisableEmailOtpResponse,
	InitEmailOtpResponse,
	MutationConfirmEmailOtpArgs,
	MutationResolvers,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import {
	AuthPolicyResolver,
	BackupCodeManager,
	ConfigurationQuery,
	EmailOtpManager,
	PermissionActions,
	PersonQuery,
	PersonRow,
} from '../../../model/index.js'
import { ImplementationException } from '../../../exceptions.js'
import { createErrorResponse } from '../../errorUtils.js'
import { ResponseOk } from '../../../model/utils/Response.js'
import { SetEmailOtpEnabledCommand } from '../../../model/commands/index.js'

export class EmailOtpMutationResolver implements Pick<MutationResolvers, 'initEmailOtp' | 'confirmEmailOtp' | 'disableEmailOtp'> {
	constructor(
		private readonly emailOtpManager: EmailOtpManager,
		private readonly backupCodeManager: BackupCodeManager,
		private readonly authPolicyResolver: AuthPolicyResolver,
	) {}

	async initEmailOtp(parent: any, args: {}, context: TenantResolverContext): Promise<InitEmailOtpResponse> {
		const person = await this.getPersonFromContext(context)
		if (!person.email) {
			return createErrorResponse('NO_EMAIL', 'Person has no email address to send the code to.')
		}
		// Send a confirmation code; enabling happens only after confirmEmailOtp.
		const config = await context.db.queryHandler.fetch(new ConfigurationQuery(context.db.providers))
		const decision = await this.emailOtpManager.sendCode(context.db, person, config)
		if (!decision.ok) {
			return createErrorResponse('RATE_LIMITED', `Too many codes requested. Retry after ${decision.retryAfterSeconds}s.`)
		}
		return {
			ok: true,
		}
	}

	async confirmEmailOtp(parent: any, args: MutationConfirmEmailOtpArgs, context: TenantResolverContext): Promise<ConfirmEmailOtpResponse> {
		const person = await this.getPersonFromContext(context)
		if (!await this.emailOtpManager.verifyAndConsume(context.db, person, args.otpToken)) {
			return createErrorResponse('INVALID_OTP_TOKEN', 'Provided code is not correct.')
		}
		await context.db.commandBus.execute(new SetEmailOtpEnabledCommand(person.id, true))
		await context.logAuthAction({
			type: '2fa_enable',
			response: new ResponseOk(null),
			personId: person.id,
		})
		// Enrolling a factor (re)issues the backup-code set, like confirmOtp.
		const backupCodes = await this.backupCodeManager.generate(context.db, person.id)
		await context.logAuthAction({
			type: 'backup_code_generated',
			response: new ResponseOk(null),
			personId: person.id,
		})
		return {
			ok: true,
			result: {
				backupCodes,
			},
		}
	}

	async disableEmailOtp(parent: any, args: {}, context: TenantResolverContext): Promise<DisableEmailOtpResponse> {
		const person = await this.getPersonFromContext(context)
		if (!person.email_otp_enabled) {
			return createErrorResponse('EMAIL_OTP_NOT_ACTIVE', 'Email OTP is not active, you cannot disable it.')
		}
		const hasActiveTotp = Boolean(person.otp_secret && person.otp_activated_at)
		// Block removal of the last factor when an effective policy mandates MFA.
		if (!hasActiveTotp) {
			const policy = await this.authPolicyResolver.resolveForIdentity(context.db, person.identity_id, person.roles)
			if (policy.mfaRequired) {
				return createErrorResponse('MFA_REQUIRED', 'MFA is required for your role; you cannot disable your only factor.')
			}
		}
		await context.db.commandBus.execute(new SetEmailOtpEnabledCommand(person.id, false))
		// If no MFA factor remains (no active TOTP, email OTP now off), drop backup codes.
		if (!hasActiveTotp) {
			await this.backupCodeManager.deleteForPerson(context.db, person.id)
		}
		await context.logAuthAction({
			type: '2fa_disable',
			response: new ResponseOk(null),
			personId: person.id,
		})
		return {
			ok: true,
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
