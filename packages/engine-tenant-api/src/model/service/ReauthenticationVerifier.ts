import { PersonRow } from '../queries/index.js'
import { Providers } from '../providers.js'
import { DatabaseContext } from '../utils/index.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { OtpManager } from './OtpManager.js'

export type ReauthenticationErrorCode = 'REAUTHENTICATION_REQUIRED' | 'INVALID_PASSWORD' | 'INVALID_OTP_TOKEN'

export interface ReauthenticationCredentials {
	readonly currentPassword?: string | null
	readonly otpToken?: string | null
}

/**
 * Confirms that a signed-in person, not just the holder of its session, asks for a sensitive change: by the current
 * password or a current TOTP code. A person with neither (e.g. signed up through an IdP only) cannot pass.
 */
export class ReauthenticationVerifier {
	constructor(
		private readonly providers: Pick<Providers, 'bcryptCompare'>,
		private readonly otpManager: OtpManager,
	) {}

	async verify(
		dbContext: DatabaseContext,
		person: PersonRow,
		{ currentPassword, otpToken }: ReauthenticationCredentials,
	): Promise<Response<null, ReauthenticationErrorCode>> {
		if (currentPassword) {
			if (!person.password_hash || !(await this.providers.bcryptCompare(currentPassword, person.password_hash))) {
				return new ResponseError('INVALID_PASSWORD', 'Password does not match')
			}
			return new ResponseOk(null)
		}
		if (otpToken) {
			if (!person.otp_secret || !person.otp_activated_at || !(await this.otpManager.verifyOtp(dbContext, person, otpToken))) {
				return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed')
			}
			return new ResponseOk(null)
		}
		return new ResponseError('REAUTHENTICATION_REQUIRED', 'The current password or an OTP token is required')
	}
}
