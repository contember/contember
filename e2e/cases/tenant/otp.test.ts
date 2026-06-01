import { expect, test } from 'bun:test'
import { Secret, TOTP } from 'otpauth'
import { createTester, executeGraphql, loginToken, rand } from '../../src/tester.js'
import { emptySchema } from '@contember/schema-utils'

const prepareOtpMutation = `mutation { prepareOtp { ok result { otpSecret otpUri } } }`
const confirmOtpMutation = `mutation($t: String!) { confirmOtp(otpToken: $t) { ok error { code } } }`
const disableOtpMutation = `mutation { disableOtp { ok error { code } } }`
const signInMutation = `mutation($email: String!, $password: String!, $otp: String) {
	signIn(email: $email, password: $password, otpToken: $otp) {
		ok
		error { code }
		result { token }
	}
}`

const generateToken = (secret: string): string => new TOTP({ secret: Secret.fromBase32(secret), digits: 6 }).generate()

const enableOtp = async (token: string): Promise<string> => {
	const prep = await executeGraphql('/tenant', prepareOtpMutation, { authorizationToken: token })
	expect(prep.body.data.prepareOtp.ok).toBe(true)
	const secret: string = prep.body.data.prepareOtp.result.otpSecret
	const confirm = await executeGraphql('/tenant', confirmOtpMutation, {
		authorizationToken: token,
		variables: { t: generateToken(secret) },
	})
	expect(confirm.body.data.confirmOtp).toEqual({ ok: true, error: null })
	return secret
}

test('after confirmOtp, signIn without otpToken returns OTP_REQUIRED', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)
	const token = await tester.tenant.signIn(email, password)
	await enableOtp(token)

	const resp = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password, otp: null },
	})
	expect(resp.body.data.signIn.ok).toBe(false)
	expect(resp.body.data.signIn.error.code).toBe('OTP_REQUIRED')
})

test('after confirmOtp, signIn with the matching otpToken succeeds', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)
	const token = await tester.tenant.signIn(email, password)
	const secret = await enableOtp(token)

	const resp = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password, otp: generateToken(secret) },
	})
	expect(resp.body.data.signIn.ok).toBe(true)
	expect(resp.body.data.signIn.result.token).toHaveLength(40)
})

test('disableOtp lifts the otpToken requirement on subsequent signIn', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)
	const token = await tester.tenant.signIn(email, password)
	await enableOtp(token)

	const disableResp = await executeGraphql('/tenant', disableOtpMutation, { authorizationToken: token })
	expect(disableResp.body.data.disableOtp).toEqual({ ok: true, error: null })

	const resp = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password, otp: null },
	})
	expect(resp.body.data.signIn.ok).toBe(true)
})

test('confirmOtp returns NOT_PREPARED if prepareOtp was never called', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)
	const token = await tester.tenant.signIn(email, password)

	const resp = await executeGraphql('/tenant', confirmOtpMutation, {
		authorizationToken: token,
		variables: { t: '123456' },
	})
	expect(resp.body.data.confirmOtp.ok).toBe(false)
	expect(resp.body.data.confirmOtp.error.code).toBe('NOT_PREPARED')
})

test('disableOtp returns OTP_NOT_ACTIVE if OTP was never enabled', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)
	const token = await tester.tenant.signIn(email, password)

	const resp = await executeGraphql('/tenant', disableOtpMutation, { authorizationToken: token })
	expect(resp.body.data.disableOtp.ok).toBe(false)
	expect(resp.body.data.disableOtp.error.code).toBe('OTP_NOT_ACTIVE')
})
