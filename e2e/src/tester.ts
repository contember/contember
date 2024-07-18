import nodeAssert from 'node:assert'
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
import { afterEach, assert, beforeEach } from 'vitest'


export const rootToken = String(process.env.CONTEMBER_ROOT_TOKEN)
export const loginToken = String(process.env.CONTEMBER_LOGIN_TOKEN)
export const apiUrl = String(process.env.CONTEMBER_API_URL)

// Used to allow prettier formatting of GraphQL queries
export const gql = (strings: TemplateStringsArray) => {
	nodeAssert.strictEqual(strings.length, 1)
	return strings[0]
}


export const executeGraphql = (
	path: string,
	query: string,
	options: { authorizationToken?: string; variables?: Record<string, any> },
) => {
	const result = supertest(apiUrl)
		.post(path)
		.set('Authorization', 'Bearer ' + (options.authorizationToken || rootToken))
		.send({
			query,
			variables: options.variables || {},
		})
	result.on('error', e => {
		// eslint-disable-next-line no-console
		console.error(e)
	})
	result.on('response', e => {
		if ('extensions' in e.body) {
			const { extensions, ...rest } = e.body
			e.body = rest
		}
	})

	return result
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

export const rand = () => Math.random().toString(36).slice(2)

export const createTester = async (schema: Schema) => {
	const projectSlug = 'test_' + rand()
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

export const consumeMails = async () => {
	const messages = await (await fetch(mailHogUrl + '/api/v1/messages')).json()
	await fetch(mailHogUrl + '/api/v1/messages', {
		method: 'DELETE',
	})
	return messages
}


const mailHogUrl = String(process.env.MAILHOG_URL)

beforeEach(async () => {
	await consumeMails()
})

afterEach(async () => {
	const mailhogMessages = await consumeMails()
	assert.deepStrictEqual(mailhogMessages, [])
})
