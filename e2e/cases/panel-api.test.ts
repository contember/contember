import { expect, test } from 'bun:test'
import supertest from 'supertest'
import { emptySchema } from '@contember/schema-utils'
import { apiUrl, createTester, executeGraphql, rand, rootToken } from '../src/tester.js'

const signInMutation = `mutation($email: String!, $password: String!) {
	signIn(email: $email, password: $password) {
		ok
		error { code }
		result { token }
	}
}`

const meQuery = `query { me { id } }`

const grantRolesMutation = `mutation($identityId: String!, $roles: [String!]!) {
	addGlobalIdentityRoles(identityId: $identityId, roles: $roles) { ok error { code } }
}`

/**
 * No Authorization header at all — that is the whole point of these tests. `Sec-Fetch-Site` stands in
 * for the browser the panel actually runs in; it is a CSRF signal, not authentication of direct clients.
 */
const postAnonymous = (path: string, query: string, variables: Record<string, unknown> = {}) =>
	supertest(apiUrl).post(path).set('Sec-Fetch-Site', 'same-origin').send({ query, variables })

const post = (path: string, query: string, token: string, variables: Record<string, unknown> = {}) =>
	supertest(apiUrl).post(path).set('Authorization', `Bearer ${token}`).send({ query, variables })

test('the panel API signs in an anonymous caller with the injected login token', async () => {
	const tester = await createTester(emptySchema)
	const email = `panel-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)

	const response = await postAnonymous('/panel/api/tenant', signInMutation, { email, password }).expect(200)

	expect(response.body.data.signIn.ok).toBe(true)
	expect(response.body.data.signIn.result.token).toBeString()
})

test('the anonymous tenant path is same-origin only', async () => {
	// The app-wide CORS headers plus a path that needs no credentials would otherwise let any page
	// drive sign-in and password reset from a visitor's browser.
	const email = `panel-${rand()}@doe.com`
	const body = { query: signInMutation, variables: { email, password: 'HWGA51KKpJ4lSW' } }

	// Not the access gate, so it must not carry the gate's header — the panel would otherwise read a
	// refused cross-origin call as "this identity may not be here" and sign the user out.
	await supertest(apiUrl).post('/panel/api/tenant').set('Origin', 'https://evil.example.com').send(body)
		.expect(403)
		.expect(res => {
			if (res.headers['x-contember-panel-error'] !== undefined) {
				throw new Error('a cross-origin refusal must not look like a panel access denial')
			}
		})
	await supertest(apiUrl).post('/panel/api/tenant').set('Sec-Fetch-Site', 'cross-site').send(body).expect(403)
	// A subdomain the attacker controls is not the panel's origin either.
	await supertest(apiUrl).post('/panel/api/tenant').set('Sec-Fetch-Site', 'same-site').send(body).expect(403)
	await supertest(apiUrl).post('/panel/api/tenant').set('Sec-Fetch-Site', 'same-origin').send(body).expect(200)
})

test('the anonymous tenant path requires same-origin browser signals', async () => {
	// A real browser sends one of the two headers. Direct clients can imitate them, so rate limits remain required.
	const email = `panel-${rand()}@doe.com`
	const body = { query: signInMutation, variables: { email, password: 'HWGA51KKpJ4lSW' } }

	await supertest(apiUrl).post('/panel/api/tenant').send(body).expect(403)
	// An `Origin` naming this host is accepted: browsers that predate `Sec-Fetch-Site` still send it.
	await supertest(apiUrl).post('/panel/api/tenant').set('Origin', apiUrl).send(body).expect(200)
})

test('the panel content and system mounts refuse an anonymous caller', async () => {
	// The login token is injected for the sign-in screen, which only ever talks to tenant.
	const tester = await createTester(emptySchema)

	await postAnonymous(`/panel/api/content/${tester.projectSlug}/live`, '{ __typename }').expect(401)
	await postAnonymous(`/panel/api/system/${tester.projectSlug}`, 'query { stages { slug } }').expect(401)
})

test('the public tenant API still rejects the same anonymous request', async () => {
	// The login token is injected for the panel mount only; nothing about the public API changed.
	const email = `panel-${rand()}@doe.com`
	await postAnonymous('/tenant', signInMutation, { email, password: 'HWGA51KKpJ4lSW' }).expect(401)
})

test('an identity outside the panel policy is refused entry', async () => {
	const tester = await createTester(emptySchema)
	const email = `panel-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)
	const token = await tester.tenant.signIn(email, password)

	// A plain person: no global role, no project membership, so neither half of the default policy
	// (super_admin / project admin) matches. The header is what the panel acts on — a bare 403 also
	// comes out of the system API for a non-member project, which is not a panel denial.
	await post('/panel/api/tenant', meQuery, token)
		.expect(403)
		.expect('X-Contember-Panel-Error', 'PANEL_ACCESS_DENIED')

	// ...and the very same session works on the public API, because entry to the console is not
	// authority — the ACL is unchanged.
	const publicResponse = await post('/tenant', meQuery, token).expect(200)
	expect(publicResponse.body.data.me.id).toBeString()
})

test('a project admin is let in', async () => {
	const tester = await createTester(emptySchema)
	const email = `panel-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	const identityId = await tester.tenant.signUp(email, password)
	// The other half of the default policy: an `admin` membership in any project is enough.
	await tester.tenant.addProjectMember(identityId, tester.projectSlug)
	const token = await tester.tenant.signIn(email, password)

	const response = await post('/panel/api/tenant', meQuery, token).expect(200)
	expect(response.body.data.me.id).toBe(identityId)
})

test('a global project admin is let in without a stored project membership', async () => {
	const tester = await createTester(emptySchema)
	const email = `panel-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	const identityId = await tester.tenant.signUp(email, password)
	const grant = await executeGraphql('/tenant', grantRolesMutation, {
		variables: { identityId, roles: ['project_admin'] },
	})
	expect(grant.body.data.addGlobalIdentityRoles.ok).toBe(true)
	const token = await tester.tenant.signIn(email, password)

	const response = await post('/panel/api/tenant', meQuery, token).expect(200)
	expect(response.body.data.me.id).toBe(identityId)
})

test('a super admin is let in', async () => {
	const response = await post('/panel/api/tenant', meQuery, rootToken).expect(200)

	expect(response.body.data.me.id).toBeString()
})
