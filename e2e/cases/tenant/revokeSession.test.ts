import { expect, test } from 'bun:test'
import { createTester, executeGraphql, rand } from '../../src/tester.js'
import { emptySchema } from '@contember/schema-utils'

const meQuery = `query { me { id } }`
const sessionsQuery = `query { me { sessions { id isCurrent } } }`
const revokeMutation = `mutation($id: String!) { revokeSession(sessionId: $id) { ok error { code } } }`

test('revokeSession invalidates the revoked token while leaving the caller usable', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)

	const tokenA = await tester.tenant.signIn(email, password)
	const tokenB = await tester.tenant.signIn(email, password)

	await executeGraphql('/tenant', meQuery, { authorizationToken: tokenA }).expect(200)

	const sessionsResp = await executeGraphql('/tenant', sessionsQuery, { authorizationToken: tokenB })
	expect(sessionsResp.status).toBe(200)
	const sessions = sessionsResp.body.data.me.sessions as { id: string; isCurrent: boolean }[]
	expect(sessions).toHaveLength(2)
	const targetSession = sessions.find(it => !it.isCurrent)
	expect(targetSession).toBeDefined()

	const revokeResp = await executeGraphql('/tenant', revokeMutation, {
		authorizationToken: tokenB,
		variables: { id: targetSession!.id },
	})
	expect(revokeResp.body).toEqual({
		data: { revokeSession: { ok: true, error: null } },
	})

	await executeGraphql('/tenant', meQuery, { authorizationToken: tokenA }).expect(401)
	await executeGraphql('/tenant', meQuery, { authorizationToken: tokenB }).expect(200)

	const afterRevoke = await executeGraphql('/tenant', sessionsQuery, { authorizationToken: tokenB })
	expect(afterRevoke.body.data.me.sessions).toHaveLength(1)
})

test('revokeSession refuses to revoke a session owned by a different identity', async () => {
	const tester = await createTester(emptySchema)
	const emailA = `alice-${rand()}@doe.com`
	const emailB = `bob-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(emailA, password)
	await tester.tenant.signUp(emailB, password)
	const tokenA = await tester.tenant.signIn(emailA, password)
	const tokenB = await tester.tenant.signIn(emailB, password)

	const sessionsA = await executeGraphql('/tenant', sessionsQuery, { authorizationToken: tokenA })
	const aSessionId = (sessionsA.body.data.me.sessions as { id: string; isCurrent: boolean }[])
		.find(it => it.isCurrent)!.id

	const resp = await executeGraphql('/tenant', revokeMutation, {
		authorizationToken: tokenB,
		variables: { id: aSessionId },
	})
	expect(resp.body.data.revokeSession.ok).toBe(false)
	expect(resp.body.data.revokeSession.error.code).toBe('SESSION_NOT_FOUND')

	await executeGraphql('/tenant', meQuery, { authorizationToken: tokenA }).expect(200)
})
