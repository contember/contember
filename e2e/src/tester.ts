import nodeAssert from 'node:assert'
import supertest from 'supertest'
import { Schema } from '@contember/schema'
import { Migration, MigrationVersionHelper, ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, VERSION_LATEST } from '@contember/schema-migrations'
import { emptySchema } from '@contember/schema-utils'
import { afterEach, beforeEach, expect } from 'bun:test'
import { TenantClient } from './TenantClient'

export const rootToken = String(process.env.CONTEMBER_ROOT_TOKEN)
export const loginToken = String(process.env.CONTEMBER_LOGIN_TOKEN)
export const apiUrl = String(process.env.CONTEMBER_API_URL)

// Used to allow prettier formatting of GraphQL queries
export const gql = (strings: TemplateStringsArray) => {
	nodeAssert.strictEqual(strings.length, 1)
	return strings[0]
}

let latestError: any = null
beforeEach(() => {
	latestError = null
})

afterEach(ctx => {
	// if (latestError !== null && ctx.task.result.state === 'fail') {
	// 	// eslint-disable-next-line no-console
	// 	console.error(latestError)
	// }
})


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
		latestError = e
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


const executeMigrations = async (projectSlug: string, modifications: Migration.Modification[], fullName: string = '2024-07-01-120000-init') => {
	const version = MigrationVersionHelper.extractVersion(fullName)
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
			expect(response.body.data).toStrictEqual({
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
	// console.log(`Creating project ${projectSlug}`)

	const tenantClient = new TenantClient(apiUrl, rootToken)
	await tenantClient.createProject(projectSlug)

	const migrations = createMigrations(schema)
	await executeMigrations(projectSlug, migrations)

	const queryCb = (
		query: string,
		options: { path?: string; authorizationToken?: string; variables?: Record<string, any> } = {}) => {
		return executeGraphql(options.path ?? '/content/' + projectSlug + '/live', query, options)
	}
	queryCb.projectSlug = projectSlug
	queryCb.migrate = async (modifications: Migration.Modification[], fullName: string) => {
		await executeMigrations(projectSlug, modifications, fullName)
	}

	queryCb.tenant = tenantClient

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
	expect(mailhogMessages).toHaveLength(0)
})
