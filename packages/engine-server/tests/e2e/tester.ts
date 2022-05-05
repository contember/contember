import nodeAssert from 'assert'
import supertest from 'supertest'
import { Schema } from '@contember/schema'
import {
	Migration,
	MigrationVersionHelper,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator, VERSION_LATEST,
} from '@contember/schema-migrations'
import { emptySchema } from '@contember/schema-utils'
import { assert } from 'vitest'


const rootToken = String(process.env.CONTEMBER_ROOT_TOKEN)
const loginToken = String(process.env.CONTEMBER_LOGIN_TOKEN)
export const apiUrl = String(process.env.CONTEMBER_API_URL)

// Used to allow prettier formatting of GraphQL queries
export const gql = (strings: TemplateStringsArray) => {
	nodeAssert.strictEqual(strings.length, 1)
	return strings[0]
}


const executeGraphql = (
	path: string,
	query: string,
	options: { authorizationToken?: string; variables?: Record<string, any> },
) => {
	return supertest(apiUrl)
		.post(path)
		.set('Authorization', 'Bearer ' + (options.authorizationToken || rootToken))
		.send({
			query,
			variables: options.variables || {},
		})
}

export const signIn = async (email: string, password: string): Promise<string> => {
	const response2 = await executeGraphql(
		'/tenant',
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
		},
	)

	return response2.body.data.signIn.result.token
}

const createMigrations = (schema: Schema) => {
	const modificationHandlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const differ = new SchemaDiffer(new SchemaMigrator(modificationHandlerFactory))
	return differ.diffSchemas(emptySchema, schema)
}

const createProject = async (slug: string) => {
	await executeGraphql(
		'/tenant',
		gql`
		mutation($projectSlug: String!, $config: Json!) {
			createProject(projectSlug: $projectSlug, config: $config) {
				ok
				error { code }
			}
		}
	`,
		{
			variables: {
				projectSlug: slug,
				config: {},
			},
		})
		.expect(response => {
			assert.isOk(response.body)
			assert.isOk(response.body.data)
			assert.isOk(response.body.data.createProject)
			assert.isOk(response.body.data.createProject.ok)
		})
		.expect(200)
}

const executeMigrations = async (projectSlug: string, modifications: Migration.Modification[]) => {
	const [version, fullName] = MigrationVersionHelper.createVersion('test')
	await executeGraphql(
		'/system/' + projectSlug,
		gql`
		mutation($migrations: [Migration!]!) {
			migrate(migrations: $migrations) {
				ok
				error { code }
			}
		}
	`,
		{
			variables: {
				migrations: [{
					formatVersion: VERSION_LATEST,
					modifications,
					version,
					name: fullName,
				}],
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
}

export const createTester = async (schema: Schema) => {
	const projectSlug = 'test_' + Date.now()
	await createProject(projectSlug)
	const migrations = createMigrations(schema)
	await executeMigrations(projectSlug, migrations)

	const queryCb = (
		query: string,
		options: { path?: string; authorizationToken?: string; variables?: Record<string, any> } = {}) => {
		return executeGraphql(options.path ?? '/content/' + projectSlug + '/live', query, options)
	}
	queryCb.projectSlug = projectSlug
	return queryCb
}
