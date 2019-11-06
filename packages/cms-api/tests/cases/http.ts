import supertest from 'supertest'
import CompositionRoot from '../../src/CompositionRoot'
import { getExampleProjectDirectory } from '@contember/engine-api-tester'
import { recreateDatabase } from '@contember/engine-api-tester/dist/src/dbUtils'
import { deepStrictEqual } from 'assert'

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

const container = new CompositionRoot().createMasterContainer(
	{
		tenant: {
			db: dbCredentials(String(process.env.TEST_DB_NAME_TENANT)),
		},
		projects: [
			{
				directory: './',
				dbCredentials: dbCredentials(String(process.env.TEST_DB_NAME)),
				name: 'test',
				slug: 'test',
				s3: {
					bucket: '',
					credentials: {
						key: '',
						secret: '',
					},
					prefix: '',
					region: '',
				},
				stages: [{ name: 'prod', slug: 'prod' }],
			},
		],
		server: {
			port: 0,
		},
	},
	getExampleProjectDirectory(),
)

const executeGraphql = (query: string, options: { authorizationToken?: string; path?: string } = {}) => {
	return supertest(container.koa.callback())
		.post(options.path || '/content/test/prod')
		.set('Authorization', 'Bearer ' + (options.authorizationToken || authKey))
		.send({
			query,
		})
}

beforeAll(async () => {
	const connection = await recreateDatabase(String(process.env.TEST_DB_NAME))
	await connection.end()
	const connection2 = await recreateDatabase(String(process.env.TEST_DB_NAME_TENANT))
	await connection2.end()
	await container.initializer.initialize()

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
	const loginToken = response.body.data.setup.result.loginKey.token
	const response2 = await await executeGraphql(
		`mutation {
  signIn(email: "admin@example.com", password: "123456" ) {
    ok
    result {
      token
    }
  }
}`,
		{
			authorizationToken: loginToken,
			path: '/tenant',
		},
	)

	authKey = response2.body.data.signIn.result.token
})

describe('http tests', () => {
	it('homepage runs', async () => {
		await supertest(container.koa.callback())
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
				deepStrictEqual(response.body.data, {
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
				deepStrictEqual(response.body.data, {
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
				deepStrictEqual(response.body.data, {
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
})
