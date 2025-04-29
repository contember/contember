import { expect, test } from 'bun:test'
import { consumeMails, createTester, loginToken, rand } from '../../src/tester'
import { emptySchema } from '@contember/schema-utils'
import * as TenantApi from '@contember/graphql-client-tenant'

test('execute password reset', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)

	const createResetResult = await tester.tenant.send(
		TenantApi.mutation$.createResetPasswordRequest(
			TenantApi.createPasswordResetRequestResponse$$,
		),
		{ email },
		{ authorizationToken: loginToken },
	)

	expect(createResetResult.status).toBe(200)
	expect(createResetResult.body).toEqual({
		data: {
			createResetPasswordRequest: {
				ok: true,
			},
		},
	})

	const mails = await consumeMails()
	expect(mails).toHaveLength(1)

	const matches = mails[0].Raw.Data.match(/<code>(.+)<\/code>/)
	const token = matches?.[1] as string
	expect(token).toHaveLength(40)

	const resetResult = await tester.tenant.send(
		TenantApi.mutation$.resetPassword(
			TenantApi.resetPasswordResponse$$,
		),
		{ token, password },
		{ authorizationToken: loginToken },
	)

	expect(resetResult.status).toBe(200)
	expect(resetResult.body).toEqual({
		data: {
			resetPassword: {
				ok: true,
			},
		},
	})

	// used token
	const usedTokenResult = await tester.tenant.send(
		TenantApi.mutation$.resetPassword(
			TenantApi.resetPasswordResponse$$,
		),
		{ token, password },
		{ authorizationToken: loginToken },
	)

	expect(usedTokenResult.status).toBe(200)
	expect(usedTokenResult.body).toEqual({
		data: {
			resetPassword: {
				ok: false,
			},
		},
	})

	const authToken = await tester.tenant.signIn(email, password)
	expect(authToken).toHaveLength(40)
})
