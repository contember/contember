import { expect, test } from 'bun:test'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { AllowAllPermissionFactory } from '@contember/schema-utils'
import { createTester, executeGraphql, loginToken, rand, rootToken } from "../../src/tester.js"

// Project-scoped policy isolation (see mfaEnforcement.test.ts): a project-scoped
// auth_policy matches project-membership roles keyed by project_id, so a unique
// role in a fresh per-test project only affects that project's members. The policy
// row is cleaned up in a finally block.

namespace TagModel {
	export class Tag {
		label = def.stringColumn()
	}
}

const signInMutation = `mutation($email: String!, $password: String!) {
	signIn(email: $email, password: $password) {
		ok
		error { code }
		result { token }
	}
}`
const createAuthPolicyMutation = `mutation($policy: AuthPolicyInput!) {
	createAuthPolicy(policy: $policy) { ok error { code } result { id } }
}`
const deleteAuthPolicyMutation = `mutation($id: String!) {
	deleteAuthPolicy(id: $id) { ok error { code } }
}`
const mySessionsQuery = `query { me { sessions { id isCurrent createdAt expiresAt } } }`

const buildSchema = (role: string) =>
	createSchema(TagModel, schema => ({
		...schema,
		acl: {
			roles: {
				[role]: {
					stages: '*',
					entities: new AllowAllPermissionFactory().create(schema.model),
					variables: {},
				},
			},
		},
	}))

const signInAndGetCurrentSession = async (email: string, password: string) => {
	const resp = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password },
	})
	expect(resp.body.data.signIn.error).toBe(null)
	expect(resp.body.data.signIn.ok).toBe(true)
	const token: string = resp.body.data.signIn.result.token
	const sessionsResp = await executeGraphql('/tenant', mySessionsQuery, { authorizationToken: token })
	const sessions = sessionsResp.body.data.me.sessions as Array<{ isCurrent: boolean; createdAt: string; expiresAt: string | null }>
	const current = sessions.find(s => s.isCurrent)
	expect(current).toBeTruthy()
	return current!
}

test('a project-scoped tokenExpiration policy caps the session lifetime; un-roled members keep the default', async () => {
	const role = `short_session_${rand()}`
	const tester = await createTester(buildSchema(role))
	const slug = tester.projectSlug
	const password = 'HWGA51KKpJ4lSW'

	// Person A holds the policy-targeted role.
	const emailA = `sess-a-${rand()}@doe.com`
	const identityA = await tester.tenant.signUp(emailA, password)
	await tester.tenant.addProjectMember(identityA, slug, { role, variables: [] })

	// Person B is a plain member, unaffected by the policy.
	const emailB = `sess-b-${rand()}@doe.com`
	const identityB = await tester.tenant.signUp(emailB, password)
	await tester.tenant.addProjectMember(identityB, slug, { role: 'admin', variables: [] })

	let policyId: string | null = null
	try {
		// Cap token lifetime at 2 minutes (default is 30 minutes) and disallow remember-me.
		const created = await executeGraphql('/tenant', createAuthPolicyMutation, {
			authorizationToken: rootToken,
			variables: {
				policy: { scope: 'project', project: slug, roles: [role], tokenExpiration: 'PT2M', rememberMeAllowed: false },
			},
		})
		expect(created.body.data.createAuthPolicy.error).toBe(null)
		expect(created.body.data.createAuthPolicy.ok).toBe(true)
		policyId = created.body.data.createAuthPolicy.result.id

		const sessionA = await signInAndGetCurrentSession(emailA, password)
		const sessionB = await signInAndGetCurrentSession(emailB, password)

		// Both sessions must report an expiry.
		expect(sessionA.expiresAt).toBeTruthy()
		expect(sessionB.expiresAt).toBeTruthy()

		const lifetimeA = new Date(sessionA.expiresAt!).getTime() - new Date(sessionA.createdAt).getTime()
		const lifetimeB = new Date(sessionB.expiresAt!).getTime() - new Date(sessionB.createdAt).getTime()

		// Person A: capped at ~2 minutes (allow a little slack).
		expect(lifetimeA).toBeLessThanOrEqual(2 * 60 * 1000 + 5000)
		expect(lifetimeA).toBeGreaterThan(0)

		// Person B: the default ~30 minutes, i.e. much longer than the capped policy.
		expect(lifetimeB).toBeGreaterThan(10 * 60 * 1000)
		expect(lifetimeB).toBeGreaterThan(lifetimeA)
	} finally {
		if (policyId !== null) {
			const del = await executeGraphql('/tenant', deleteAuthPolicyMutation, {
				authorizationToken: rootToken,
				variables: { id: policyId },
			})
			expect(del.body.data.deleteAuthPolicy.ok).toBe(true)
		}
	}
})
