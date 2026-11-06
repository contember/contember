import { expect, test } from 'bun:test'
import crypto from 'node:crypto'
import { Secret, TOTP } from 'otpauth'
import { consumeMails, createTester, executeGraphql, loginToken, rand } from '../../src/tester.js'
import { emptySchema } from '@contember/schema-utils'

const configureMutation = `mutation {
	configure(config: { passwordless: { enabled: always, url: "https://example.com" } }) { ok }
}`
const initMutation = `mutation($email: String!) {
	initSignInPasswordless(email: $email) { ok result { requestId } }
}`
const activateOtpMutation = `mutation($requestId: String!, $token: String!, $otpHash: String!) {
	activatePasswordlessOtp(requestId: $requestId, token: $token, otpHash: $otpHash) { ok }
}`
const signInMutation = `mutation($requestId: String!, $token: String!, $validationType: PasswordlessValidationType!, $mfaOtp: String) {
	signInPasswordless(requestId: $requestId, token: $token, validationType: $validationType, mfaOtp: $mfaOtp) {
		ok
		error { code }
	}
}`
const prepareOtpMutation = `mutation { prepareOtp { ok result { otpSecret } } }`
const confirmOtpMutation = `mutation($t: String!) { confirmOtp(otpToken: $t) { ok } }`

const totp = (secret: string): string => new TOTP({ secret: Secret.fromBase32(secret), digits: 6 }).generate()

const otherCode = (code: string): string => code === '000000' ? '111111' : '000000'

const requestMagicLink = async (email: string): Promise<{ requestId: string; token: string }> => {
	const configure = await executeGraphql('/tenant', configureMutation, {})
	expect(configure.body.data.configure.ok).toBe(true)
	const init = await executeGraphql('/tenant', initMutation, { authorizationToken: loginToken, variables: { email } })
	expect(init.body.data.initSignInPasswordless.ok).toBe(true)
	const mails = await consumeMails()
	expect(mails).toHaveLength(1)
	const token = mails[0].Raw.Data.match(/token&#x3D;(\w+)/)?.[1]
	expect(token).toHaveLength(40)
	return { requestId: init.body.data.initSignInPasswordless.result.requestId, token: String(token) }
}

const signIn = async (variables: { requestId: string; token: string; validationType: 'token' | 'otp'; mfaOtp?: string }) => {
	const response = await executeGraphql('/tenant', signInMutation, { authorizationToken: loginToken, variables })
	return response.body.data.signInPasswordless as { ok: boolean; error: { code: string } | null }
}

test('wrong MFA codes on a magic link use up its attempts', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)
	const sessionToken = await tester.tenant.signIn(email, password)
	const prepare = await executeGraphql('/tenant', prepareOtpMutation, { authorizationToken: sessionToken })
	const secret: string = prepare.body.data.prepareOtp.result.otpSecret
	const confirm = await executeGraphql('/tenant', confirmOtpMutation, { authorizationToken: sessionToken, variables: { t: totp(secret) } })
	expect(confirm.body.data.confirmOtp.ok).toBe(true)

	const { requestId, token } = await requestMagicLink(email)
	for (let i = 0; i < 3; i++) {
		expect(await signIn({ requestId, token, validationType: 'token', mfaOtp: otherCode(totp(secret)) })).toEqual({
			ok: false,
			error: { code: 'INVALID_OTP_TOKEN' },
		})
	}

	expect(await signIn({ requestId, token, validationType: 'token', mfaOtp: totp(secret) })).toEqual({
		ok: false,
		error: { code: 'TOKEN_USED' },
	})
})

test('parallel wrong codes cannot exceed the attempt limit', async () => {
	const tester = await createTester(emptySchema)
	const email = `jane-${rand()}@doe.com`
	await tester.tenant.signUp(email, 'HWGA51KKpJ4lSW')

	const { requestId, token } = await requestMagicLink(email)
	const code = '424242'
	const otpHash = crypto.createHash('sha256').update(code, 'ascii').digest('hex')
	const activate = await executeGraphql('/tenant', activateOtpMutation, { authorizationToken: loginToken, variables: { requestId, token, otpHash } })
	expect(activate.body.data.activatePasswordlessOtp.ok).toBe(true)

	const results = await Promise.all(
		Array.from({ length: 10 }, (_, i) => signIn({ requestId, token: String(100000 + i), validationType: 'otp' })),
	)
	const checked = results.filter(it => it.error?.code === 'TOKEN_INVALID')
	expect(checked.length).toBeLessThanOrEqual(3)
	expect(results.every(it => !it.ok)).toBe(true)

	expect((await signIn({ requestId, token: code, validationType: 'otp' })).ok).toBe(false)
})
