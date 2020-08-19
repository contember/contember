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
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import { PermissionActions, PersonQuery, PersonRow } from '../../../model'
import { OtpManager } from '../../../model/service'
import { ImplementationException } from '../../../exceptions'

export class OtpMutationResolver implements MutationResolvers {
	constructor(
		private readonly otpManager: OtpManager,
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
	) {}

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
			return { ok: false, errors: [{ code: ConfirmOtpErrorCode.NotPrepared }] }
		}
		if (!this.otpManager.verifyOtp(person, args.otpToken)) {
			return { ok: false, errors: [{ code: ConfirmOtpErrorCode.InvalidOtpToken }] }
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
			return { ok: false, errors: [{ code: DisableOtpErrorCode.OtpNotActive }] }
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
			message: 'You are not allowed to setup a otp',
		})
		const person = await this.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))
		if (!person) {
			throw new ImplementationException('Person should exists')
		}

		return person
	}
}
