import {
	ConfirmOtpErrorCode,
	ConfirmOtpResponse,
	DisableOtpErrorCode,
	DisableOtpResponse,
	MutationConfirmOtpArgs,
	MutationPrepareOtpArgs,
	MutationResolvers,
	PrepareOtpResponse,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { DatabaseContext, OtpManager, PermissionActions, PersonQuery, PersonRow } from '../../../model'
import { ImplementationException } from '../../../exceptions'
import { createErrorResponse } from '../../errorUtils'

export class OtpMutationResolver implements MutationResolvers {
	constructor(private readonly otpManager: OtpManager, private readonly dbContext: DatabaseContext) {}

	async prepareOtp(parent: any, args: MutationPrepareOtpArgs, context: ResolverContext): Promise<PrepareOtpResponse> {
		const person = await this.getPersonFromContext(context)
		const otp = await this.otpManager.prepareOtp(person, args.label || 'Contember')
		return {
			ok: true,
			result: {
				otpUri: otp.uri,
				otpSecret: otp.secret,
			},
		}
	}

	async confirmOtp(parent: any, args: MutationConfirmOtpArgs, context: ResolverContext): Promise<ConfirmOtpResponse> {
		const person = await this.getPersonFromContext(context)
		if (!person.otp_uri) {
			return createErrorResponse(
				ConfirmOtpErrorCode.NotPrepared,
				`OTP setup was not initialized. Call prepareOtp first.`,
			)
		}
		if (!this.otpManager.verifyOtp(person, args.otpToken)) {
			return createErrorResponse(ConfirmOtpErrorCode.InvalidOtpToken, 'Provided token is not correct.')
		}
		await this.otpManager.confirmOtp(person)
		return {
			ok: true,
			errors: [],
		}
	}

	async disableOtp(parent: any, args: {}, context: ResolverContext): Promise<DisableOtpResponse> {
		const person = await this.getPersonFromContext(context)
		if (!person.otp_uri) {
			return createErrorResponse(DisableOtpErrorCode.OtpNotActive, 'OTP is not active, you cannot disable it.')
		}
		await this.otpManager.disableOtp(person)
		return {
			ok: true,
			errors: [],
		}
	}

	private async getPersonFromContext(context: ResolverContext): Promise<PersonRow> {
		await context.requireAccess({
			action: PermissionActions.PERSON_SETUP_OTP,
			message: 'You are not allowed to setup a OTP',
		})
		const person = await this.dbContext.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))
		if (!person) {
			throw new ImplementationException('Person should exists')
		}

		return person
	}
}
