import { expect, test } from 'bun:test'
import { createTester, executeGraphql, gql, rand } from '../../src/tester'
import { emptySchema } from '@contember/schema-utils'

const sendTenant = (
	query: string,
	options: { variables?: Record<string, any>; authorizationToken?: string } = {},
) => executeGraphql('/tenant', query, { ...options, keepExtensions: true })

const createPolicyMutation = gql`
	mutation($input: CreatePolicyInput!) {
		createPolicy(input: $input) {
			ok
			error { code }
			result { policy { id slug label document { statements { effect actions resources } } version } }
		}
	}
`

const viewerDocument = {
	statements: [
		{ effect: 'allow', actions: ['tenant:policy.view'], resources: ['*'] },
	],
}

test('Tenant API: policy CRUD lifecycle', async () => {
	await createTester(emptySchema)
	const slug = `crud-${rand()}`

	// create
	const created = await sendTenant(createPolicyMutation, {
		variables: { input: { slug, label: 'CRUD policy', document: viewerDocument } },
	})
	expect(created.body.data.createPolicy).toMatchObject({
		ok: true,
		error: null,
		result: {
			policy: {
				slug,
				label: 'CRUD policy',
				version: 1,
				document: { statements: [{ effect: 'allow', actions: ['tenant:policy.view'], resources: ['*'] }] },
			},
		},
	})

	// read back via list + by slug
	const listed = await sendTenant(gql`query { policies { slug } }`)
	expect(listed.body.data.policies.map((p: any) => p.slug)).toContain(slug)

	const bySlug = await sendTenant(gql`query($slug: String!) { policy(slug: $slug) { slug label } }`, {
		variables: { slug },
	})
	expect(bySlug.body.data.policy).toMatchObject({ slug, label: 'CRUD policy' })

	// update
	const updated = await sendTenant(
		gql`
			mutation($slug: String!, $input: UpdatePolicyInput!) {
				updatePolicy(slug: $slug, input: $input) {
					ok
					error { code }
					result { policy { label document { statements { actions } } } }
				}
			}
		`,
		{
			variables: {
				slug,
				input: {
					label: 'Renamed',
					document: { statements: [{ effect: 'allow', actions: ['tenant:policy.view', 'tenant:project.view'], resources: ['*'] }] },
				},
			},
		},
	)
	expect(updated.body.data.updatePolicy).toMatchObject({
		ok: true,
		error: null,
		result: { policy: { label: 'Renamed', document: { statements: [{ actions: ['tenant:policy.view', 'tenant:project.view'] }] } } },
	})

	// delete
	const deleted = await sendTenant(gql`mutation($slug: String!) { deletePolicy(slug: $slug) { ok error { code } } }`, {
		variables: { slug },
	})
	expect(deleted.body.data.deletePolicy).toMatchObject({ ok: true, error: null })

	const afterDelete = await sendTenant(gql`query($slug: String!) { policy(slug: $slug) { slug } }`, {
		variables: { slug },
	})
	expect(afterDelete.body.data.policy).toBeNull()
})

test('Tenant API: createPolicy validation errors', async () => {
	await createTester(emptySchema)
	const slug = `valid-${rand()}`

	// reserved builtin: prefix
	const reserved = await sendTenant(createPolicyMutation, {
		variables: { input: { slug: `builtin:${slug}`, document: viewerDocument } },
	})
	expect(reserved.body.data.createPolicy).toMatchObject({ ok: false, error: { code: 'SLUG_RESERVED' } })

	// invalid slug characters
	const invalid = await sendTenant(createPolicyMutation, {
		variables: { input: { slug: 'Not A Valid Slug!', document: viewerDocument } },
	})
	expect(invalid.body.data.createPolicy).toMatchObject({ ok: false, error: { code: 'INVALID_SLUG' } })

	// duplicate slug
	const first = await sendTenant(createPolicyMutation, { variables: { input: { slug, document: viewerDocument } } })
	expect(first.body.data.createPolicy.ok).toBe(true)
	const duplicate = await sendTenant(createPolicyMutation, { variables: { input: { slug, document: viewerDocument } } })
	expect(duplicate.body.data.createPolicy).toMatchObject({ ok: false, error: { code: 'SLUG_ALREADY_EXISTS' } })

	// cleanup
	await sendTenant(gql`mutation($slug: String!) { deletePolicy(slug: $slug) { ok } }`, { variables: { slug } })
})

test('Tenant API: assigned policy grants permission end-to-end, revoke removes it', async () => {
	const tester = await createTester(emptySchema)
	const slug = `viewer-${rand()}`
	const email = `policy+${rand()}@example.com`

	const identityId = await tester.tenant.signUp(email)
	const token = await tester.tenant.signIn(email)

	const policiesQuery = gql`query { policies { slug } }`

	// before assignment: non-admin identity cannot list policies (POLICY_VIEW denied)
	const before = await sendTenant(policiesQuery, { authorizationToken: token })
	expect(before.body.data?.policies ?? null).toBeNull()
	expect(before.body.errors?.[0]?.extensions?.code).toBe('ForbiddenError')

	// create a policy granting tenant:policy.view and assign it to the identity
	const created = await sendTenant(createPolicyMutation, { variables: { input: { slug, document: viewerDocument } } })
	expect(created.body.data.createPolicy.ok).toBe(true)

	const assigned = await sendTenant(
		gql`mutation($identityId: String!, $slug: String!) { assignPolicy(identityId: $identityId, policySlug: $slug) { ok error { code } } }`,
		{ variables: { identityId, slug } },
	)
	expect(assigned.body.data.assignPolicy).toMatchObject({ ok: true, error: null })

	// self-view shows the assignment
	const me = await sendTenant(gql`query { me { policies { policy { slug } tags } } }`, { authorizationToken: token })
	expect(me.body.data.me.policies.map((a: any) => a.policy.slug)).toContain(slug)

	// after assignment: the engine grants POLICY_VIEW, the query now succeeds
	const after = await sendTenant(policiesQuery, { authorizationToken: token })
	expect(after.body.errors ?? null).toBeNull()
	expect(after.body.data.policies.map((p: any) => p.slug)).toContain(slug)

	// revoke -> permission gone again
	const revoked = await sendTenant(
		gql`mutation($identityId: String!, $slug: String!) { revokePolicy(identityId: $identityId, policySlug: $slug) { ok error { code } } }`,
		{ variables: { identityId, slug } },
	)
	expect(revoked.body.data.revokePolicy).toMatchObject({ ok: true, error: null })

	const afterRevoke = await sendTenant(policiesQuery, { authorizationToken: token })
	expect(afterRevoke.body.data?.policies ?? null).toBeNull()
	expect(afterRevoke.body.errors?.[0]?.extensions?.code).toBe('ForbiddenError')

	// cleanup
	await sendTenant(gql`mutation($slug: String!) { deletePolicy(slug: $slug) { ok } }`, { variables: { slug } })
})

test('Tenant API: builtinPolicies are exposed', async () => {
	await createTester(emptySchema)
	const res = await sendTenant(gql`query { builtinPolicies { role slug document { statements { effect actions } } } }`)
	const builtins = res.body.data.builtinPolicies
	expect(Array.isArray(builtins)).toBe(true)
	expect(builtins.length).toBeGreaterThan(0)
	// super_admin built-in must allow everything
	const superAdmin = builtins.find((p: any) => p.role === 'super_admin')
	expect(superAdmin).toBeTruthy()
	expect(superAdmin.document.statements.some((s: any) => s.effect === 'allow' && s.actions.includes('*'))).toBe(true)
})
