import url from 'url'
import { authenticator } from 'otplib'

const getSecret = function(otp: { uri: string } | { secret: string }) {
	return 'uri' in otp ? (url.parse(otp.uri, true).query.secret as string) : otp.secret
}
export const verifyOtp = (otp: { uri: string } | { secret: string }, token: string): boolean => {
	const secret = getSecret(otp)
	return authenticator.verify({ token, secret })
}

export const generateOtp = (otp: { uri: string } | { secret: string }): string => {
	const secret = getSecret(otp)
	return authenticator.generate(secret)
}

export interface OtpData {
	secret: string
	uri: string
}

export const createOtp = (user: string, label: string): OtpData => {
	const secret = authenticator.generateSecret(16)
	const uri = authenticator.keyuri(user, label, secret)
	return { secret, uri }
}
