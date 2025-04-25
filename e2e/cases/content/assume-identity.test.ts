import { test } from 'bun:test'
import { createTester, gql } from '../../src/tester'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { AllowAllPermissionFactory } from '@contember/schema-utils'

namespace TagModel {
	export class Tag {
		label = def.stringColumn()
	}
}

test('Content API: assume identity', async () => {
	const tester = await createTester(createSchema(TagModel, schema => {
		return {
			...schema,
			acl: {
				roles: {
					test: {
						entities: new AllowAllPermissionFactory().create(schema.model),
						variables: {},
						system: {
							history: true,
							assumeIdentity: true,
						},
					},
				},
			},
		}
	}))

	const email = `john+${Date.now()}@doe.com`
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, { role: 'test', variables: [] })

	const assumedIdentityId = '65e049e7-4b22-487a-a93b-528b3127d967'
	await tester(
		gql`
			mutation {
				createTag(data: {label: "foo bar"}) {
					ok
				}
			}
		`,
		{ authorizationToken: authKey },
	)
		.set('X-Contember-assume-identity', assumedIdentityId)
		.expect(200)


	await tester(
		gql`
			query {
				events {
					tableName
					identityId
				}
			}
		`,
		{ authorizationToken: authKey, path: `/system/${tester.projectSlug}` },
	)
		.expect({ data: { events: [{ tableName: 'tag', identityId: assumedIdentityId }] } })
		.expect(200)
})


test('Content API: assume identity is declined', async () => {
	const tester = await createTester(createSchema(TagModel, schema => {
		return {
			...schema,
			acl: {
				roles: {
					foo: {
						entities: {},
						variables: {},
						system: {
							assumeIdentity: true,
						},
					},
					test: {
						entities: new AllowAllPermissionFactory().create(schema.model),
						variables: {},
						system: {
							history: true,
						},
					},
				},
			},
		}
	}))

	const email = `john+${Date.now()}@doe.com`
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, { role: 'test', variables: [] })

	const assumedIdentityId = '65e049e7-4b22-487a-a93b-528b3127d967'
	await tester(
		gql`
			mutation {
				createTag(data: {label: "foo bar"}) {
					ok
				}
			}
		`,
		{ authorizationToken: authKey },
	)
		.set('X-Contember-assume-identity', assumedIdentityId)
		.expect(200)


	await tester(
		gql`
			query {
				events {
					tableName
					identityId
				}
			}
		`,
		{ authorizationToken: authKey, path: `/system/${tester.projectSlug}` },
	)
		.expect({ data: { events: [{ tableName: 'tag', identityId }] } })
		.expect(200)
})
