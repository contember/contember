import crypto from 'node:crypto'
import { FixedLengthHexString, isFixedLengthHexString } from './hex'
import { PersonToken } from '../type'
import { ImplementationException } from '../../exceptions'
import { Response, ResponseError, ResponseOk } from './Response'

export const generateToken = async (generator: {
	randomBytes: (bytes: number) => Promise<Buffer>
}): Promise<string> => {
	return (await generator.randomBytes(20)).toString('hex')
}

export type TokenHash = FixedLengthHexString<64>

export const computeTokenHash = (token: string): TokenHash => {
	return crypto //
		.createHash('sha256')
		.update(token, 'ascii')
		.digest('hex') as TokenHash
}

export const isTokenHash = (token: string): token is TokenHash => isFixedLengthHexString(token, 64)


const MAX_OTP_ATTEMPTS = 3

export const validateToken = ({ entry, validationType, token, now }: {
	entry: PersonToken.Row | null
	validationType: PersonToken.ValidationType
	token: string
	now: Date
}): Response<PersonToken.Row, PersonToken.TokenValidationError> => {
	if (!entry) {
		return new ResponseError('TOKEN_NOT_FOUND', 'Token not found')
	}
	if (validationType === 'otp' && entry.otp_attempts >= MAX_OTP_ATTEMPTS) {
		return new ResponseError('TOKEN_EXPIRED', 'OTP attempts exceeded')
	}
	switch (validationType) {
		case 'token':
			if (entry.otp_hash !== null) {
				return new ResponseError('TOKEN_INVALID', 'The token was exchanged for OTP')
			}
			if (entry.token_hash !== computeTokenHash(token)) {
				return new ResponseError('TOKEN_INVALID', 'Token invalid')
			}
			break
		case 'otp':
			if (entry.otp_hash === null) {
				return new ResponseError('TOKEN_INVALID', 'OTP not set')
			}
			if (entry.otp_hash !== computeTokenHash(token)) {
				return new ResponseError('TOKEN_INVALID', 'OTP invalid')
			}
			break
		default:
			throw new ImplementationException()
	}
	if (entry.used_at) {
		return new ResponseError('TOKEN_USED', 'Token used at ' + entry.used_at.toISOString())
	}
	if (entry.expires_at < now) {
		return new ResponseError('TOKEN_EXPIRED', 'Token expired at ' + entry.expires_at.toISOString())
	}
	return new ResponseOk(entry)
}
