import supertest from 'supertest'
import * as nodeAssert from 'assert'
import { assert, beforeAll, test } from 'vitest'
import { MigrationFilesManager, MigrationsResolver } from '@contember/schema-migrations'
import { getExampleProjectDirectory } from '@contember/engine-api-tester'


const rootToken = String(process.env.CONTEMBER_ROOT_TOKEN)
const loginToken = String(process.env.CONTEMBER_LOGIN_TOKEN)
const apiUrl = String(process.env.CONTEMBER_API_URL)
let projectSlug = ''

// Used to allow prettier formatting of GraphQL queries
const gql = (strings: TemplateStringsArray) => {
	nodeAssert.strictEqual(strings.length, 1)
	return strings[0]
}


const executeGraphql = (
	query: string,
	options: { authorizationToken?: string; path?: string; variables?: Record<string, any> } = {},
) => {
	return supertest(apiUrl)
		.post(options.path || `/content/${projectSlug}/live`)
		.set('Authorization', 'Bearer ' + (options.authorizationToken || rootToken))
		.send({
			query,
			variables: options.variables || {},
		})
}

const signIn = async (email: string, password: string): Promise<string> => {
	const response2 = await executeGraphql(
		gql`
			mutation ($email: String!, $password: String!) {
				signIn(email: $email, password: $password) {
					ok
					result {
						token
					}
				}
			}
		`,
		{
			variables: { email, password },
			authorizationToken: loginToken,
			path: '/tenant',
		},
	)

	return response2.body.data.signIn.result.token
}

beforeAll(async () => {
	projectSlug = 'test' + Date.now()
	const result = await executeGraphql(`
		mutation($projectSlug: String!, $config: Json!) {
			createProject(projectSlug: $projectSlug, config: $config) {
				ok
				error { code }
			}
		}
	`,
	{
		path: '/tenant',
		variables: {
			projectSlug: projectSlug,
			config: {},
		},
	})
		.expect(response => {
			assert.isOk(response.body)
			assert.isOk(response.body.data)
			assert.isOk(response.body.data.createProject)
			if (!response.body.data.createProject.ok) {
				assert.equal(response.body.data.createProject.error.code, 'ALREADY_EXISTS')
			}
		})
		.expect(200)
	if (!result.body.data.createProject.ok) {
		return
	}
	const migrationFilesManager = new MigrationsResolver(MigrationFilesManager.createForProject(getExampleProjectDirectory(), 'sample'))
	const migrations = await migrationFilesManager.getMigrations()
	assert.isAtLeast(migrations.length, 2)
	await executeGraphql(`
		mutation($migrations: [Migration!]!) {
			migrate(migrations: $migrations) {
				ok
				error { code }
			}
		}
	`,
	{
		path: '/system/' + projectSlug,
		variables: {
			migrations,
		},
	})
		.expect(response => {
			assert.deepStrictEqual(response.body.data, {
				migrate: {
					error: null,
					ok: true,
				},
			})
		})
})

test('show homepage', async () => {
	await supertest(apiUrl)
		.get('/')
		.expect(200)
		.expect('App is running')
})

test('Content API: create & read tag', async () => {
	await executeGraphql(
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

	await executeGraphql(
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
	await executeGraphql(
		gql`
			mutation {
				createTag(data: { label: "typescript" }) {
					ok
				}
			}
		`,
	).expect(200)

	const response = await executeGraphql(
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
	await executeGraphql(
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
	await executeGraphql(
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
	await executeGraphql(
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
				'Cannot query field "createFoo" on type "Mutation". Did you mean "createPost" or "createTag"?',
			)
		})
})

test('Tenant API: sign up, add to a project and check project access', async () => {
	const email = `john+${Date.now()}@doe.com`
	const signUpResponse = await executeGraphql(
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
	await executeGraphql(
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
		.expect({ errors: [{ message: `Project ${projectSlug} NOT found`, code: 404 }] })

	await executeGraphql(
		gql`
			mutation ($identity: String!, $projectSlug: String!) {
				addProjectMember(identityId: $identity, projectSlug: $projectSlug, memberships: [{ role: "admin", variables: [] }]) {
					ok
				}
			}
		`,
		{ path: '/tenant', variables: { identity: identityId, projectSlug } },
	)
		.expect(200)
		.expect(response => {
			assert.deepStrictEqual(response.body.data, { addProjectMember: { ok: true } })
		})

	await executeGraphql(
		gql`
			query {
				listAuthor {
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
