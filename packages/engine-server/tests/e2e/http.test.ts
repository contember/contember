import supertest from 'supertest'
import { assert, test } from 'vitest'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { apiUrl, createTester, gql, signIn } from './tester'


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
	const signUpResponse = await tester(
		gql`
			mutation($email: String!) {
				signUp(email: $email, password: "123456") {
					ok
					result {
						person {
							identity {
								id
							}
						}
					}
				}
			}
		`,
		{
			path: '/tenant',
			variables: { email },
		},
	).expect(200)

	const identityId = signUpResponse.body.data.signUp.result.person.identity.id

	const authKey = await signIn(email, '123456')
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

	await tester(
		gql`
			mutation ($identity: String!, $projectSlug: String!) {
				addProjectMember(identityId: $identity, projectSlug: $projectSlug, memberships: [{ role: "admin", variables: [] }]) {
					ok
				}
			}
		`,
		{ path: '/tenant', variables: { identity: identityId, projectSlug: tester.projectSlug } },
	)
		.expect(200)
		.expect(response => {
			assert.deepStrictEqual(response.body.data, { addProjectMember: { ok: true } })
		})

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
			assert.deepStrictEqual(response.body.data, { listAuthor: [] })
		})
		.expect(200)
})
