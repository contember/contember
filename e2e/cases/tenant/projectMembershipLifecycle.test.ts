import { expect, test } from 'bun:test'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { AllowAllPermissionFactory } from '@contember/schema-utils'
import { createTester, executeGraphql, gql, rand } from '../../src/tester'

namespace TagModel {
	export class Tag {
		label = def.stringColumn()
	}
}

const schema = createSchema(TagModel, schema => ({
	...schema,
	acl: {
		roles: {
			editor: {
				stages: '*',
				entities: new AllowAllPermissionFactory().create(schema.model),
				variables: {},
			},
			viewer: {
				stages: '*',
				entities: new AllowAllPermissionFactory().create(schema.model),
				variables: {},
			},
		},
	},
}))

const addMember = `mutation($slug: String!, $identityId: String!, $memberships: [MembershipInput!]!) {
	addProjectMember(projectSlug: $slug, identityId: $identityId, memberships: $memberships) {
		ok error { code }
	}
}`

const updateMember = `mutation($slug: String!, $identityId: String!, $memberships: [MembershipInput!]!) {
	updateProjectMember(projectSlug: $slug, identityId: $identityId, memberships: $memberships) {
		ok error { code }
	}
}`

const removeMember = `mutation($slug: String!, $identityId: String!) {
	removeProjectMember(projectSlug: $slug, identityId: $identityId) {
		ok error { code }
	}
}`

const myMembershipsQuery = `query($slug: String!) {
	me {
		projects {
			project { slug }
			memberships { role }
		}
	}
	projectBySlug(slug: $slug) { slug }
}`

const fetchMyRole = async (token: string, slug: string): Promise<string | null> => {
	const resp = await executeGraphql('/tenant', myMembershipsQuery, {
		authorizationToken: token,
		variables: { slug },
	})
	const projects = resp.body.data.me.projects as { project: { slug: string }; memberships: { role: string }[] }[]
	const project = projects.find(p => p.project.slug === slug)
	return project?.memberships[0]?.role ?? null
}

test('add/update/remove project member: each transition flips content-side accessibility and the recorded role', async () => {
	const tester = await createTester(schema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	const identityId = await tester.tenant.signUp(email, password)
	const token = await tester.tenant.signIn(email, password)

	// no membership → content denied
	expect(await fetchMyRole(token, tester.projectSlug)).toBeNull()
	await tester(gql`query { listTag { id } }`, { authorizationToken: token }).expect(404)

	// add as viewer
	const addResp = await executeGraphql('/tenant', addMember, {
		variables: {
			slug: tester.projectSlug,
			identityId,
			memberships: [{ role: 'viewer', variables: [] }],
		},
	})
	expect(addResp.body.data.addProjectMember).toEqual({ ok: true, error: null })
	expect(await fetchMyRole(token, tester.projectSlug)).toBe('viewer')
	await tester(gql`query { listTag { id } }`, { authorizationToken: token }).expect(200)

	// addProjectMember again → ALREADY_MEMBER
	const addAgain = await executeGraphql('/tenant', addMember, {
		variables: {
			slug: tester.projectSlug,
			identityId,
			memberships: [{ role: 'viewer', variables: [] }],
		},
	})
	expect(addAgain.body.data.addProjectMember.ok).toBe(false)
	expect(addAgain.body.data.addProjectMember.error.code).toBe('ALREADY_MEMBER')

	// update to editor
	const updateResp = await executeGraphql('/tenant', updateMember, {
		variables: {
			slug: tester.projectSlug,
			identityId,
			memberships: [{ role: 'editor', variables: [] }],
		},
	})
	expect(updateResp.body.data.updateProjectMember).toEqual({ ok: true, error: null })
	expect(await fetchMyRole(token, tester.projectSlug)).toBe('editor')
	await tester(gql`query { listTag { id } }`, { authorizationToken: token }).expect(200)

	// remove
	const removeResp = await executeGraphql('/tenant', removeMember, {
		variables: { slug: tester.projectSlug, identityId },
	})
	expect(removeResp.body.data.removeProjectMember).toEqual({ ok: true, error: null })
	expect(await fetchMyRole(token, tester.projectSlug)).toBeNull()
	await tester(gql`query { listTag { id } }`, { authorizationToken: token }).expect(404)
})

test('updateProjectMember returns NOT_MEMBER if the identity has no membership yet', async () => {
	const tester = await createTester(schema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	const identityId = await tester.tenant.signUp(email, password)

	const resp = await executeGraphql('/tenant', updateMember, {
		variables: {
			slug: tester.projectSlug,
			identityId,
			memberships: [{ role: 'editor', variables: [] }],
		},
	})
	expect(resp.body.data.updateProjectMember.ok).toBe(false)
	expect(resp.body.data.updateProjectMember.error.code).toBe('NOT_MEMBER')
})

test('removeProjectMember returns NOT_MEMBER for a never-added identity', async () => {
	const tester = await createTester(schema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	const identityId = await tester.tenant.signUp(email, password)

	const resp = await executeGraphql('/tenant', removeMember, {
		variables: { slug: tester.projectSlug, identityId },
	})
	expect(resp.body.data.removeProjectMember.ok).toBe(false)
	expect(resp.body.data.removeProjectMember.error.code).toBe('NOT_MEMBER')
})
