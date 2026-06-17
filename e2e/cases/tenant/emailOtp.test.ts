import { expect, test } from 'bun:test'
import { consumeMails, createTester, executeGraphql, loginToken, rand } from '../../src/tester.js'
import { emptySchema } from '@contember/schema-utils'

const initEmailOtpMutation = `mutation { initEmailOtp { ok error { code } } }`
const confirmEmailOtpMutation = `mutation($t: String!) { confirmEmailOtp(otpToken: $t) { ok error { code } result { backupCodes } } }`
const disableEmailOtpMutation = `mutation { disableEmailOtp { ok error { code } } }`
const signInMutation = `mutation($email: String!, $password: String!, $otp: String) {
	signIn(email: $email, password: $password, otpToken: $otp) {
		ok
		error { code }
		result { token }
	}
}`

/** Pulls the latest 6-digit numeric code out of the most recent mailhog message. */
const readEmailedCode = async (): Promise<string> => {
	const messages = await consumeMails()
	expect(messages.length).toBeGreaterThanOrEqual(1)
	// Mailhog stores the raw MIME body (quoted-printable, possibly soft-wrapped).
	const body: string = messages[0].Content.Body
	// strip quoted-printable soft line breaks and any '=XX' artifacts around the digits
	const normalized = body.replace(/=\r?\n/g, '').replace(/=3D/g, '=')
	// The template prints the recipient address before the code, and our random
	// `john-<base36>@doe.com` local part can itself contain a 6-digit run that
	// `\d{6}` would grab instead of the real code (~0.3 % of addresses → a flaky
	// INVALID_OTP_TOKEN). Strip email addresses first so only the OTP can match.
	const withoutAddresses = normalized.replace(/[^\s<>()"]+@[^\s<>()"]+/g, '')
	const match = withoutAddresses.match(/(\d{6})/)
	expect(match).not.toBeNull()
	return match![1]
}

const setupPerson = async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)
	const token = await tester.tenant.signIn(email, password)
	return { email, password, token }
}

const enableEmailOtp = async (token: string): Promise<string[]> => {
	const init = await executeGraphql('/tenant', initEmailOtpMutation, { authorizationToken: token })
	expect(init.body.data.initEmailOtp).toEqual({ ok: true, error: null })
	const code = await readEmailedCode()
	const confirm = await executeGraphql('/tenant', confirmEmailOtpMutation, {
		authorizationToken: token,
		variables: { t: code },
	})
	expect(confirm.body.data.confirmEmailOtp.error).toBe(null)
	expect(confirm.body.data.confirmEmailOtp.ok).toBe(true)
	return confirm.body.data.confirmEmailOtp.result.backupCodes
}

test('initEmailOtp + confirmEmailOtp enables email OTP and returns backup codes', async () => {
	const { token } = await setupPerson()
	const backupCodes = await enableEmailOtp(token)
	expect(backupCodes).toHaveLength(10)
})

test('confirmEmailOtp with a wrong code fails with INVALID_OTP_TOKEN', async () => {
	const { token } = await setupPerson()
	const init = await executeGraphql('/tenant', initEmailOtpMutation, { authorizationToken: token })
	expect(init.body.data.initEmailOtp).toEqual({ ok: true, error: null })
	// consume the emitted code mail so the afterEach mailbox check stays clean
	await consumeMails()

	const confirm = await executeGraphql('/tenant', confirmEmailOtpMutation, {
		authorizationToken: token,
		variables: { t: '000000-wrong' },
	})
	expect(confirm.body.data.confirmEmailOtp.ok).toBe(false)
	expect(confirm.body.data.confirmEmailOtp.error.code).toBe('INVALID_OTP_TOKEN')
})

test('once enabled, signIn without otp returns OTP_REQUIRED and emails a code; signIn with that code succeeds', async () => {
	const { email, password, token } = await setupPerson()
	await enableEmailOtp(token)

	// first sign-in: password only -> OTP_REQUIRED + a code is emailed
	const first = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password, otp: null },
	})
	expect(first.body.data.signIn.ok).toBe(false)
	expect(first.body.data.signIn.error.code).toBe('OTP_REQUIRED')
	const code = await readEmailedCode()

	// The OTP_REQUIRED step is logged as a failed `login`, so the per-email backoff
	// (base 1s) gates an immediate retry; wait it out before supplying the code.
	await new Promise(resolve => setTimeout(resolve, 1200))

	// second sign-in: supply the emailed code -> success
	const second = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password, otp: code },
	})
	expect(second.body.data.signIn.error).toBe(null)
	expect(second.body.data.signIn.ok).toBe(true)
	expect(second.body.data.signIn.result.token).toHaveLength(40)
})

test('disableEmailOtp lifts the requirement: subsequent signIn with just password succeeds', async () => {
	const { email, password, token } = await setupPerson()
	await enableEmailOtp(token)

	const disable = await executeGraphql('/tenant', disableEmailOtpMutation, { authorizationToken: token })
	expect(disable.body.data.disableEmailOtp).toEqual({ ok: true, error: null })

	const resp = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password, otp: null },
	})
	expect(resp.body.data.signIn.error).toBe(null)
	expect(resp.body.data.signIn.ok).toBe(true)
})
