import supertest from 'supertest'
import CompositionRoot from '../../src/CompositionRoot'
import { getExampleProjectDirectory, recreateDatabase } from '@contember/engine-api-tester'
import assert from 'assert'

const dbCredentials = (dbName: string) => {
	return {
		host: String(process.env.TEST_DB_HOST),
		port: Number(process.env.TEST_DB_PORT),
		user: String(process.env.TEST_DB_USER),
		password: String(process.env.TEST_DB_PASSWORD),
		database: dbName,
	}
}

let authKey = ''
let loginToken = ''

const createContainer = (debug: boolean) =>
	new CompositionRoot().createMasterContainer(
		debug,
		{
			tenant: {
				db: dbCredentials(String(process.env.TEST_DB_NAME_TENANT)),
				mailer: {},
			},
			projects: {
				test: {
					directory: './',
					db: dbCredentials(String(process.env.TEST_DB_NAME)),
					name: 'test',
					slug: 'test',
					stages: [{ name: 'prod', slug: 'prod' }],
				},
			},
			server: {
				logging: {},
				port: 0,
			},
		},
		getExampleProjectDirectory(),
		[],
	)

const executeGraphql = (
	query: string,
	options: { authorizationToken?: string; path?: string; variables?: Record<string, any>; debug?: boolean } = {},
) => {
	const container = createContainer(options.debug || false)
	return supertest(container.koa.callback())
		.post(options.path || '/content/test/prod')
		.set('Authorization', 'Bearer ' + (options.authorizationToken || authKey))
		.send({
			query,
			variables: options.variables || {},
		})
}

const signIn = async (email: string, password: string): Promise<string> => {
	const response2 = await executeGraphql(
		`mutation($email: String!, $password: String!) {
  signIn(email: $email, password: $password ) {
    ok
    result {
      token
    }
  }
}`,
		{
			variables: { email, password },
			authorizationToken: loginToken,
			path: '/tenant',
		},
	)

	return response2.body.data.signIn.result.token
}

beforeAll(async () => {
	const connection = await recreateDatabase(String(process.env.TEST_DB_NAME))
	await connection.end()
	const connection2 = await recreateDatabase(String(process.env.TEST_DB_NAME_TENANT))
	await connection2.end()
	await createContainer(false).initializer.initialize()

	const response = await executeGraphql(
		`mutation {
  setup(superadmin: { email: "admin@example.com", password: "123456" }) {
    ok
    result {
      superadmin {
        id
      }
      loginKey {
        id
        token
        identity {
          id
        }
      }
    }
  }
}`,
		{
			path: '/tenant',
			authorizationToken: '12345123451234512345',
		},
	)
	loginToken = response.body.data.setup.result.loginKey.token
	authKey = await signIn('admin@example.com', '123456')
})

describe('http tests', () => {
	it('homepage runs', async () => {
		await supertest(createContainer(false).koa.callback())
			.get('/')
			.expect(200)
			.expect('App is running')
	})

	it('creates & read tag', async () => {
		await executeGraphql(`mutation {
		createTag(data: {label: "graphql"})  {
			ok
		}
}`)
			.expect(response => {
				assert.deepStrictEqual(response.body.data, {
					createTag: {
						ok: true,
					},
				})
			})
			.expect(200)

		await executeGraphql(`query {
		listTag(filter: {label: {eq: "graphql"}}) {
			label
		}
}`)
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

	it('handles "not modified"', async () => {
		await executeGraphql(`mutation {
		createTag(data: {label: "typescript"})  {
			ok
		}
}`).expect(200)

		const response = await executeGraphql(`query {
		listTag(filter: {label: {eq: "typescript"}}) {
			label
		}
}`)
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
		await executeGraphql(`query {
		listTag {
			label
		}
}`)
			.set('X-Contember-Ref', eventKey)
			.expect(304)

		// ignored for mutation
		await executeGraphql(`mutation {
		createTag(data: {label: "typescript"})  {
			ok
		}
}`)
			.set('X-Contember-Ref', eventKey)
			.expect(200)
	})

	it('returns proper error for invalid schema', async () => {
		await executeGraphql(`mutation {
		createFoo(data: {label: "graphql"})  {
			ok
		}
}`)
			.expect(400)
			.expect(response => {
				assert.equal(
					response.body.errors[0].message,
					'Cannot query field "createFoo" on type "Mutation". Did you mean "createTag", "createPost", "createEntry", or "createAuthor"?',
				)
			})
	})

	it('sign up, add to a project and check project access', async () => {
		const signUpResponse = await executeGraphql(
			`mutation {
  signUp(email: "john@doe.com", password: "123456") {
    ok
    result {
      person {
        identity {
          id
        }
      }
    }
  }
}`,
			{ path: '/tenant' },
		).expect(200)

		const identityId = signUpResponse.body.data.signUp.result.person.identity.id

		const authKey = await signIn('john@doe.com', '123456')
		await executeGraphql(
			`query {
		listTag {
			id
		}
}`,
			{ authorizationToken: authKey },
		)
			.expect(404)
			.expect({ errors: [{ message: 'Project test NOT found', code: 404 }] })

		await executeGraphql(
			`query {
		listTag {
			id
		}
}`,
			{ authorizationToken: authKey, debug: true },
		)
			.expect(403)
			.expect({
				errors: [{ message: 'You are not allowed to access project test', code: 403 }],
				identity: { roles: ['person'] },
			})

		await executeGraphql(
			`mutation($identity: String!) {
  addProjectMember(identityId: $identity, projectSlug: "test", memberships: [{role: "admin", variables: []}]) {
    ok
  }
}`,
			{ path: '/tenant', variables: { identity: identityId } },
		)
			.expect(200)
			.expect(response => {
				assert.deepStrictEqual(response.body.data, { addProjectMember: { ok: true } })
			})

		await executeGraphql(
			`query {
		listAuthor {
			id
		}
}`,
			{ authorizationToken: authKey },
		)
			.expect(response => {
				assert.deepStrictEqual(response.body.data, { listAuthor: [] })
			})
			.expect(200)
	})
})
