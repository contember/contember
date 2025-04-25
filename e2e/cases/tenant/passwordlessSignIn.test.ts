import { expect, test } from 'bun:test'
import { consumeMails, createTester, loginToken, rand } from '../../src/tester'
import { emptySchema } from '@contember/schema-utils'
import * as TenantApi from '@contember/graphql-client-tenant'

test('sign in using magic link', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)

	const configResult = await tester.tenant.send(
		TenantApi.mutation$.configure(TenantApi.configureResponse$$),
		{
			config: { passwordless: { enabled: 'always', url: 'https://example.com' } },
		},
	)
	expect(configResult.status).toBe(200)
	expect(configResult.body).toEqual({ data: { configure: { ok: true } } })

	const initResult = await tester.tenant.send(
		TenantApi.mutation$
			.initSignInPasswordless(
				TenantApi.initSignInPasswordlessResponse$$
					.result(TenantApi.initSignInPasswordlessResult$$),
			),
		{
			email: email,
		},
		{ authorizationToken: loginToken },
	)

	expect(initResult.status).toBe(200)
	const requestId = initResult.body.data.initSignInPasswordless.result.requestId

	const mails = await consumeMails()
	expect(mails).toHaveLength(1)

	const matches = mails[0].Raw.Data.match(/token&#x3D;(\w+)/)
	const token = matches?.[1] as string
	expect(token).toHaveLength(40)

	// invalid token
	const invalidTokenResult = await tester.tenant.send(
		TenantApi.mutation$
			.signInPasswordless(
				TenantApi.signInPasswordlessResponse$$
					.error(TenantApi.signInPasswordlessError$$),
			),
		{
			requestId: requestId,
			token: 'ABCD',
			validationType: 'token',
		},
		{ authorizationToken: loginToken },
	)

	expect(invalidTokenResult.status).toBe(200)
	expect(invalidTokenResult.body).toMatchObject({
		data: {
			signInPasswordless: {
				ok: false,
				error: {
					code: 'TOKEN_INVALID',
				},
			},
		},
	})

	// valid
	const validTokenResult = await tester.tenant.send(
		TenantApi.mutation$
			.signInPasswordless(
				TenantApi.signInPasswordlessResponse$$
					.error(TenantApi.signInPasswordlessError$$),
			),
		{
			requestId: requestId,
			token: token,
			validationType: 'token',
		},
		{ authorizationToken: loginToken },
	)

	expect(validTokenResult.status).toBe(200)
	expect(validTokenResult.body).toMatchObject({
		data: {
			signInPasswordless: {
				ok: true,
				error: null,
			},
		},
	})
})
