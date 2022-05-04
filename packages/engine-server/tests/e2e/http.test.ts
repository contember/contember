import supertest from 'supertest'
import { assert, test } from 'vitest'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { apiUrl, createTester, gql } from './tester'
import { addProjectMember, signIn, signUp } from './requests'


test('show homepage', async () => {
	await supertest(apiUrl)
		.get('/')
		.expect(200)
		.expect('App is running')
})

namespace TagModel {
	export class Tag {
		label = def.stringColumn()
	}
}

test('Content API: create & read tag', async () => {
	const tester = await createTester(createSchema(TagModel))

	await tester(
		gql`
			mutation {
				createTag(data: { label: "graphql" }) {
					ok
				}
			}
		`,
	)
		.expect(response => {
			assert.deepStrictEqual(response.body.data, {
				createTag: {
					ok: true,
				},
			})
		})
		.expect(200)

	await tester(
		gql`
			query {
				listTag(filter: { label: { eq: "graphql" } }) {
					label
				}
			}
		`,
	)
		.expect(response => {
			assert.deepStrictEqual(response.body.data, {
				listTag: [
					{
						label: 'graphql',
					},
				],
			})
		})
		.expect(200)
})

test('Content API: X-Contember-Ref header', async () => {

	const tester = await createTester(createSchema(TagModel))

	await tester(
		gql`
			mutation {
				createTag(data: { label: "typescript" }) {
					ok
				}
			}
		`,
	).expect(200)

	const response = await tester(
		gql`
			query {
				listTag(filter: { label: { eq: "typescript" } }) {
					label
				}
			}
		`,
	)
		.set('X-Contember-Ref', 'None')
		.expect(response => {
			assert.deepStrictEqual(response.body.data, {
				listTag: [
					{
						label: 'typescript',
					},
				],
			})
		})
		.expect(200)
	const eventKey = response.get('X-Contember-Ref')
	await tester(
		gql`
			query {
				listTag {
					label
				}
			}
		`,
	)
		.set('X-Contember-Ref', eventKey)
		.expect(304)

	// ignored for mutation
	await tester(
		gql`
			mutation {
				createTag(data: { label: "typescript" }) {
					ok
				}
			}
		`,
	)
		.set('X-Contember-Ref', eventKey)
		.expect(200)
})

test('Content API: invalid schema error', async () => {
	const tester = await createTester(createSchema(TagModel))

	await tester(
		gql`
			mutation {
				createFoo(data: { label: "graphql" }) {
					ok
				}
			}
		`,
	)
		.expect(400)
		.expect(response => {
			assert.deepStrictEqual(
				response.body.errors[0].message,
				'Cannot query field "createFoo" on type "Mutation". Did you mean "createTag"?',
			)
		})
})

test('Tenant API: sign up, add to a project and check project access', async () => {
	const tester = await createTester(createSchema(TagModel))

	const email = `john+${Date.now()}@doe.com`
	const identityId = await signUp(email)
	const authKey = await signIn(email)

	await tester(
		gql`
			query {
				listTag {
					id
				}
			}
		`,
		{ authorizationToken: authKey },
	)
		.expect(404)
		.expect({ errors: [{ message: `Project ${tester.projectSlug} NOT found`, code: 404 }] })


	await addProjectMember(identityId, tester.projectSlug)

	await tester(
		gql`
			query {
				listTag {
					id
				}
			}
		`,
		{ authorizationToken: authKey },
	)
		.expect(response => {
			assert.deepStrictEqual(response.body.data, { listTag: [] })
		})
		.expect(200)
})


test('Content API: assume membership', async () => {
	const tester = await createTester(createSchema(TagModel, schema => {
		return {
			...schema,
			acl: {
				roles: {
					test: {
						entities: {},
						variables: {},
						content: {
							assumeMembership: {
								admin: {},
							},
						},
					},
				},
			},
		}
	}))

	const email = `john+${Date.now()}@doe.com`
	const identityId = await signUp(email)
	const authKey = await signIn(email)
	await addProjectMember(identityId, tester.projectSlug, 'test')

	await tester(
		gql`
			query {
				listTag {
					id
				}
			}
		`,
		{ authorizationToken: authKey },
	)
		.expect(400)



	await tester(
		gql`
			query {
				listTag {
					id
				}
			}
		`,
		{ authorizationToken: authKey },
	)
		.set('X-Contember-assume-membership', JSON.stringify({ memberships: [{ role: 'admin', variables: [] }] }))
		.expect({ data: { listTag: [] } })
		.expect(200)
})
