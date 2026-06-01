import {
	ConfirmOtpResponse,
	DisableOtpResponse,
	MutationConfirmOtpArgs,
	MutationPrepareOtpArgs,
	MutationResolvers,
	PrepareOtpResponse,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { OtpManager, PermissionActions, PersonQuery, PersonRow } from '../../../model/index.js'
import { ImplementationException } from '../../../exceptions.js'
import { createErrorResponse } from '../../errorUtils.js'
import { ResponseError, ResponseOk } from '../../../model/utils/Response.js'

export class OtpMutationResolver implements MutationResolvers {
	constructor(private readonly otpManager: OtpManager) {}

	async prepareOtp(parent: any, args: MutationPrepareOtpArgs, context: TenantResolverContext): Promise<PrepareOtpResponse> {
		const person = await this.getPersonFromContext(context)
		const otp = await this.otpManager.prepareOtp(context.db, person, args.label || 'Contember')
		if (person.otp_activated_at) {
			await context.logAuthAction({
				type: '2fa_disable',
				response: new ResponseOk(null),
				personId: person.id,
			})
		}
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
		if (!person.otp_uri) {
			return createErrorResponse(
				'NOT_PREPARED',
				`OTP setup was not initialized. Call prepareOtp first.`,
			)
		}
		if (!this.otpManager.verifyOtp(person, args.otpToken)) {
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
		return {
			ok: true,
			errors: [],
		}
	}

	async disableOtp(parent: any, args: {}, context: TenantResolverContext): Promise<DisableOtpResponse> {
		const person = await this.getPersonFromContext(context)
		if (!person.otp_uri) {
			return createErrorResponse('OTP_NOT_ACTIVE', 'OTP is not active, you cannot disable it.')
		}
		await this.otpManager.disableOtp(context.db, person)
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
