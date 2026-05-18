import { expect, test } from 'bun:test'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { AllowAllPermissionFactory } from '@contember/schema-utils'
import { createTester, executeGraphql, gql } from '../../src/tester'

namespace TagModel {
	export class Tag {
		label = def.stringColumn()
	}
}

const schemaWithEditor = createSchema(TagModel, schema => ({
	...schema,
	acl: {
		roles: {
			editor: {
				stages: '*',
				entities: new AllowAllPermissionFactory().create(schema.model),
				variables: {},
			},
		},
	},
}))

const createApiKeyMutation = `mutation($slug: String!, $memberships: [MembershipInput!]!, $description: String!) {
	createApiKey(projectSlug: $slug, memberships: $memberships, description: $description) {
		ok
		error { code }
		result { apiKey { id token identity { id } } }
	}
}`

const disableApiKeyMutation = `mutation($id: String!) {
	disableApiKey(id: $id) { ok error { code } }
}`

test('createApiKey grants content access; disableApiKey revokes it', async () => {
	const tester = await createTester(schemaWithEditor)

	const createResp = await executeGraphql('/tenant', createApiKeyMutation, {
		variables: {
			slug: tester.projectSlug,
			memberships: [{ role: 'editor', variables: [] }],
			description: 'backend ingest',
		},
	})
	expect(createResp.body.data.createApiKey.ok).toBe(true)
	const apiKey = createResp.body.data.createApiKey.result.apiKey
	expect(apiKey.token).toHaveLength(40)

	// content access works
	await tester(
		gql`query { listTag { id } }`,
		{ authorizationToken: apiKey.token },
	)
		.expect(200)
		.expect({ data: { listTag: [] } })

	// disable
	const disableResp = await executeGraphql('/tenant', disableApiKeyMutation, {
		variables: { id: apiKey.id },
	})
	expect(disableResp.body.data.disableApiKey).toEqual({ ok: true, error: null })

	// content access now rejected at auth layer
	await tester(
		gql`query { listTag { id } }`,
		{ authorizationToken: apiKey.token },
	).expect(401)
})

test('createApiKey returns PROJECT_NOT_FOUND for an unknown projectSlug', async () => {
	const tester = await createTester(schemaWithEditor)
	void tester
	const resp = await executeGraphql('/tenant', createApiKeyMutation, {
		variables: {
			slug: 'definitely-not-a-project',
			memberships: [{ role: 'editor', variables: [] }],
			description: 'whatever',
		},
	})
	expect(resp.body.data.createApiKey.ok).toBe(false)
	expect(resp.body.data.createApiKey.error.code).toBe('PROJECT_NOT_FOUND')
})

test('disableApiKey returns KEY_NOT_FOUND for an unknown id', async () => {
	const tester = await createTester(schemaWithEditor)
	void tester
	const resp = await executeGraphql('/tenant', disableApiKeyMutation, {
		variables: { id: '00000000-0000-0000-0000-000000000000' },
	})
	expect(resp.body.data.disableApiKey.ok).toBe(false)
	expect(resp.body.data.disableApiKey.error.code).toBe('KEY_NOT_FOUND')
})
