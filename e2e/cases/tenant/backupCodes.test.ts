import { expect, test } from 'bun:test'
import { Secret, TOTP } from 'otpauth'
import { createTester, executeGraphql, loginToken, rand } from '../../src/tester.js'
import { emptySchema } from '@contember/schema-utils'

const prepareOtpMutation = `mutation { prepareOtp { ok result { otpSecret otpUri } } }`
const confirmOtpMutation = `mutation($t: String!) { confirmOtp(otpToken: $t) { ok error { code } result { backupCodes } } }`
const regenerateBackupCodesMutation = `mutation { regenerateBackupCodes { ok error { code } result { backupCodes } } }`
const signInMutation = `mutation($email: String!, $password: String!, $otp: String, $backupCode: String) {
	signIn(email: $email, password: $password, otpToken: $otp, backupCode: $backupCode) {
		ok
		error { code }
		result { token }
	}
}`

const generateToken = (secret: string): string => new TOTP({ secret: Secret.fromBase32(secret), digits: 6 }).generate()

const enableOtp = async (token: string): Promise<{ secret: string; backupCodes: string[] }> => {
	const prep = await executeGraphql('/tenant', prepareOtpMutation, { authorizationToken: token })
	expect(prep.body.data.prepareOtp.ok).toBe(true)
	const secret: string = prep.body.data.prepareOtp.result.otpSecret
	const confirm = await executeGraphql('/tenant', confirmOtpMutation, {
		authorizationToken: token,
		variables: { t: generateToken(secret) },
	})
	expect(confirm.body.data.confirmOtp.ok).toBe(true)
	expect(confirm.body.data.confirmOtp.error).toBe(null)
	return { secret, backupCodes: confirm.body.data.confirmOtp.result.backupCodes }
}

const setupPerson = async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)
	const token = await tester.tenant.signIn(email, password)
	return { email, password, token }
}

test('confirmOtp returns 10 backup codes', async () => {
	const { token } = await setupPerson()
	const { backupCodes } = await enableOtp(token)
	expect(backupCodes).toHaveLength(10)
	for (const code of backupCodes) {
		expect(typeof code).toBe('string')
		expect(code.length).toBeGreaterThan(0)
	}
})

test('signIn with a backup code succeeds for an OTP-enabled person', async () => {
	const { email, password, token } = await setupPerson()
	const { backupCodes } = await enableOtp(token)

	const resp = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password, otp: null, backupCode: backupCodes[0] },
	})
	expect(resp.body.data.signIn.error).toBe(null)
	expect(resp.body.data.signIn.ok).toBe(true)
	expect(resp.body.data.signIn.result.token).toHaveLength(40)
})

test('a backup code is single-use: reusing the same code fails with INVALID_OTP_TOKEN', async () => {
	const { email, password, token } = await setupPerson()
	const { backupCodes } = await enableOtp(token)
	const code = backupCodes[0]

	const first = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password, otp: null, backupCode: code },
	})
	expect(first.body.data.signIn.ok).toBe(true)

	const second = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password, otp: null, backupCode: code },
	})
	expect(second.body.data.signIn.ok).toBe(false)
	expect(second.body.data.signIn.error.code).toBe('INVALID_OTP_TOKEN')
})

test('regenerateBackupCodes returns a fresh set of 10 and invalidates the old ones', async () => {
	const { email, password, token } = await setupPerson()
	const { backupCodes: oldCodes } = await enableOtp(token)

	const regen = await executeGraphql('/tenant', regenerateBackupCodesMutation, { authorizationToken: token })
	expect(regen.body.data.regenerateBackupCodes.error).toBe(null)
	expect(regen.body.data.regenerateBackupCodes.ok).toBe(true)
	const newCodes: string[] = regen.body.data.regenerateBackupCodes.result.backupCodes
	expect(newCodes).toHaveLength(10)
	// fresh set: none of the new codes equals the first old code
	expect(newCodes).not.toContain(oldCodes[0])

	// a new code works (assert success before any failed attempt to avoid rate-limit backoff)
	const newResp = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password, otp: null, backupCode: newCodes[0] },
	})
	expect({ ok: newResp.body.data.signIn.ok, error: newResp.body.data.signIn.error }).toEqual({ ok: true, error: null })

	// an old code no longer works
	const oldResp = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password, otp: null, backupCode: oldCodes[0] },
	})
	expect(oldResp.body.data.signIn.ok).toBe(false)
	expect(oldResp.body.data.signIn.error.code).toBe('INVALID_OTP_TOKEN')
})
