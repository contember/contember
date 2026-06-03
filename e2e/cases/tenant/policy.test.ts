import { expect, test } from 'bun:test'
import { createTester, executeGraphql, gql, rand } from '../../src/tester.js'
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

test('Tenant API: grant boundary — a delegated manager can only grant within its own surface', async () => {
	const tester = await createTester(emptySchema)
	const email = `delegate+${rand()}@example.com`
	const delegateId = await tester.tenant.signUp(email)
	const delegateToken = await tester.tenant.signIn(email)

	// As super_admin: grant the delegate policy management + a *limited* surface
	// (idp.* only). This becomes the delegate's grantable surface.
	const managerSlug = `manager-${rand()}`
	const createManager = await sendTenant(createPolicyMutation, {
		variables: {
			input: {
				slug: managerSlug,
				document: {
					statements: [
						{
							effect: 'allow',
							actions: [
								'tenant:policy.view',
								'tenant:policy.create',
								'tenant:policy.update',
								'tenant:policy.delete',
								'tenant:policy.assign',
								'tenant:policy.revoke',
								'tenant:idp.add',
								'tenant:idp.update',
								'tenant:idp.list',
							],
							resources: ['*'],
						},
					],
				},
			},
		},
	})
	expect(createManager.body.data.createPolicy.ok).toBe(true)

	const assignManager = await sendTenant(
		gql`mutation($identityId: String!, $slug: String!) { assignPolicy(identityId: $identityId, policySlug: $slug) { ok error { code } } }`,
		{ variables: { identityId: delegateId, slug: managerSlug } },
	)
	expect(assignManager.body.data.assignPolicy).toMatchObject({ ok: true, error: null })

	const asDelegate = (input: any) => sendTenant(createPolicyMutation, { variables: { input }, authorizationToken: delegateToken })

	// ALLOWED: granting a subset of the delegate's own surface
	const withinSurface = await asDelegate({
		slug: `ok-${rand()}`,
		document: { statements: [{ effect: 'allow', actions: ['tenant:idp.add'], resources: ['*'] }] },
	})
	expect(withinSurface.body.data.createPolicy).toMatchObject({ ok: true, error: null })

	// ALLOWED: sub-delegating policy.assign (it is in the surface) stays bounded
	const subDelegate = await asDelegate({
		slug: `ok-sub-${rand()}`,
		document: { statements: [{ effect: 'allow', actions: ['tenant:policy.assign', 'tenant:idp.list'], resources: ['*'] }] },
	})
	expect(subDelegate.body.data.createPolicy).toMatchObject({ ok: true, error: null })

	// REJECTED: an action outside the surface
	const outside = await asDelegate({
		slug: `bad-${rand()}`,
		document: { statements: [{ effect: 'allow', actions: ['tenant:project.create'], resources: ['*'] }] },
	})
	expect(outside.body.data.createPolicy).toMatchObject({ ok: false, error: { code: 'EXCEEDS_PERMISSIONS' } })

	// REJECTED: a wildcard grant the enumerated surface cannot cover
	const wildcard = await asDelegate({
		slug: `bad-wild-${rand()}`,
		document: { statements: [{ effect: 'allow', actions: ['*'], resources: ['*'] }] },
	})
	expect(wildcard.body.data.createPolicy).toMatchObject({ ok: false, error: { code: 'EXCEEDS_PERMISSIONS' } })

	// REJECTED: a deny on an out-of-surface action (removing it later would escalate)
	const denyOutside = await asDelegate({
		slug: `bad-deny-${rand()}`,
		document: { statements: [{ effect: 'deny', actions: ['tenant:project.create'], resources: ['*'] }] },
	})
	expect(denyOutside.body.data.createPolicy).toMatchObject({ ok: false, error: { code: 'EXCEEDS_PERMISSIONS' } })

	// REJECTED: assigning a powerful policy authored by super_admin
	const powerfulSlug = `powerful-${rand()}`
	const powerful = await sendTenant(createPolicyMutation, {
		variables: { input: { slug: powerfulSlug, document: { statements: [{ effect: 'allow', actions: ['tenant:project.create'], resources: ['*'] }] } } },
	})
	expect(powerful.body.data.createPolicy.ok).toBe(true)

	const victimEmail = `victim+${rand()}@example.com`
	const victimId = await tester.tenant.signUp(victimEmail)
	const assignPowerful = await sendTenant(
		gql`mutation($identityId: String!, $slug: String!) { assignPolicy(identityId: $identityId, policySlug: $slug) { ok error { code } } }`,
		{ variables: { identityId: victimId, slug: powerfulSlug }, authorizationToken: delegateToken },
	)
	expect(assignPowerful.body.data.assignPolicy).toMatchObject({ ok: false, error: { code: 'EXCEEDS_PERMISSIONS' } })

	// REJECTED: even deleting that powerful policy (it mentions out-of-surface actions)
	const deletePowerful = await sendTenant(
		gql`mutation($slug: String!) { deletePolicy(slug: $slug) { ok error { code } } }`,
		{ variables: { slug: powerfulSlug }, authorizationToken: delegateToken },
	)
	expect(deletePowerful.body.data.deletePolicy).toMatchObject({ ok: false, error: { code: 'EXCEEDS_PERMISSIONS' } })

	// --- update: both the old and the new document must stay within the surface ---
	const updateMutation = gql`
		mutation($slug: String!, $input: UpdatePolicyInput!) {
			updatePolicy(slug: $slug, input: $input) { ok error { code } }
		}
	`
	// delegate authors an in-surface policy it owns
	const editableSlug = `editable-${rand()}`
	const editable = await asDelegate({
		slug: editableSlug,
		document: { statements: [{ effect: 'allow', actions: ['tenant:idp.add'], resources: ['*'] }] },
	})
	expect(editable.body.data.createPolicy.ok).toBe(true)

	// ALLOWED: narrowing/keeping within surface
	const updWithin = await sendTenant(updateMutation, {
		variables: {
			slug: editableSlug,
			input: { document: { statements: [{ effect: 'allow', actions: ['tenant:idp.add', 'tenant:idp.list'], resources: ['*'] }] } },
		},
		authorizationToken: delegateToken,
	})
	expect(updWithin.body.data.updatePolicy).toMatchObject({ ok: true, error: null })

	// REJECTED: new document adds an out-of-surface action
	const updBeyond = await sendTenant(updateMutation, {
		variables: { slug: editableSlug, input: { document: { statements: [{ effect: 'allow', actions: ['tenant:project.create'], resources: ['*'] }] } } },
		authorizationToken: delegateToken,
	})
	expect(updBeyond.body.data.updatePolicy).toMatchObject({ ok: false, error: { code: 'EXCEEDS_PERMISSIONS' } })

	// REJECTED (old-document arm): cannot touch a powerful policy even to weaken it
	const updPowerful = await sendTenant(updateMutation, {
		variables: { slug: powerfulSlug, input: { document: { statements: [{ effect: 'allow', actions: ['tenant:idp.add'], resources: ['*'] }] } } },
		authorizationToken: delegateToken,
	})
	expect(updPowerful.body.data.updatePolicy).toMatchObject({ ok: false, error: { code: 'EXCEEDS_PERMISSIONS' } })

	// super_admin remains unrestricted: it can delete the powerful policy
	const superDelete = await sendTenant(gql`mutation($slug: String!) { deletePolicy(slug: $slug) { ok } }`, { variables: { slug: powerfulSlug } })
	expect(superDelete.body.data.deletePolicy.ok).toBe(true)
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
