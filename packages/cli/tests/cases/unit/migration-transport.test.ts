import { describe, expect, test } from 'bun:test'
import { CliError, ExitCode } from '@contember/cli-common'
import { GraphQlClient, GraphQlClientError, GraphQlErrorType } from '@contember/graphql-client'
import { SystemClient } from '@contember/migrations-client'
import { SystemClientProvider } from '../../../src/lib/SystemClientProvider.js'
import { RemoteProject } from '../../../src/lib/project/RemoteProject.js'
import { RemoteProjectProvider } from '../../../src/lib/project/RemoteProjectProvider.js'

class FailingSystemClient extends SystemClient {
	constructor(private readonly failure: unknown) {
		super(new GraphQlClient({ url: 'https://system.test/system/project' }))
	}

	public override async migrate(...args: Parameters<SystemClient['migrate']>): Promise<never> {
		void args
		throw this.failure
	}

	public override async migrateFromSnapshot(...args: Parameters<SystemClient['migrateFromSnapshot']>): Promise<never> {
		void args
		throw this.failure
	}

	public override async migrationDelete(...args: Parameters<SystemClient['migrationDelete']>): Promise<never> {
		void args
		throw this.failure
	}

	public override async migrationModify(...args: Parameters<SystemClient['migrationModify']>): Promise<never> {
		void args
		throw this.failure
	}

	public override async listExecutedMigrations(...args: Parameters<SystemClient['listExecutedMigrations']>): Promise<never> {
		void args
		throw this.failure
	}

	public override async getExecutedMigration(...args: Parameters<SystemClient['getExecutedMigration']>): Promise<never> {
		void args
		throw this.failure
	}
}

const createProvider = (failure: unknown): SystemClientProvider => {
	const remoteProjectProvider = new RemoteProjectProvider()
	remoteProjectProvider.setRemoteProject(
		new RemoteProject('project', 'https://user:password@example.com/api/?token=secret#fragment', 'api-token'),
	)
	return new SystemClientProvider(remoteProjectProvider, () => new FailingSystemClient(failure))
}

const graphQlError = (type: GraphQlErrorType, response?: Response): GraphQlClientError =>
	new GraphQlClientError(
		'response contains private server context',
		type,
		{
			url: 'https://user:password@example.com/api/system/project?token=secret#fragment',
			query: 'query with private values',
			variables: { token: 'secret' },
		},
		response,
	)

const catchCliError = async (request: () => Promise<unknown>): Promise<CliError> => {
	try {
		await request()
	} catch (error) {
		if (error instanceof CliError) {
			return error
		}
		throw error
	}
	throw new Error('Expected a CliError')
}

const clientOperations: ReadonlyArray<{ name: string; execute: (client: SystemClient) => Promise<unknown> }> = [
	{ name: 'migrate', execute: client => client.migrate([]) },
	{
		name: 'migrateFromSnapshot',
		execute: client => client.migrateFromSnapshot({ formatVersion: 1, modifications: [], covers: [] }),
	},
	{ name: 'migrationDelete', execute: client => client.migrationDelete('2024-01-01-120000') },
	{ name: 'migrationModify', execute: client => client.migrationModify('2024-01-01-120000', {}) },
	{ name: 'listExecutedMigrations', execute: client => client.listExecutedMigrations() },
	{ name: 'getExecutedMigration', execute: client => client.getExecutedMigration('2024-01-01-120000') },
]

describe('SystemClientProvider transport boundary', () => {
	const statusCases: ReadonlyArray<{
		status: number
		type: GraphQlErrorType
		code: string
		exitCode: ExitCode
	}> = [
		{ status: 401, type: 'unauthorized', code: 'SYSTEM_API_UNAUTHORIZED', exitCode: ExitCode.Forbidden },
		{ status: 403, type: 'forbidden', code: 'SYSTEM_API_FORBIDDEN', exitCode: ExitCode.Forbidden },
		{ status: 429, type: 'bad request', code: 'SYSTEM_API_RATE_LIMITED', exitCode: ExitCode.Transient },
		{ status: 500, type: 'server error', code: 'SYSTEM_API_SERVER_ERROR', exitCode: ExitCode.Transient },
	]

	for (const { status, type, code, exitCode } of statusCases) {
		test(`maps HTTP ${status} with stable CLI metadata`, async () => {
			const provider = createProvider(graphQlError(type, new Response(null, { status })))
			const error = await catchCliError(() => provider.get().listExecutedMigrations())

			expect(error.code).toBe(code)
			expect(error.exitCode).toBe(exitCode)
			expect(error.retryable).toBe(exitCode === ExitCode.Transient)
			expect(error.details).toEqual({
				type,
				status,
				url: 'https://example.com/api/system/project',
			})
			expect(JSON.stringify(error)).not.toContain('secret')
		})
	}

	for (const operation of clientOperations) {
		test(`${operation.name} maps a rejected network request`, async () => {
			const provider = createProvider(graphQlError('network error'))
			const error = await catchCliError(() => operation.execute(provider.get()))

			expect(error.code).toBe('SYSTEM_API_UNREACHABLE')
			expect(error.exitCode).toBe(ExitCode.Transient)
			expect(error.retryable).toBe(true)
		})
	}

	test('preserves migration-domain error arrays', async () => {
		const domainFailure = [{ code: 'INVALID_SCHEMA', migration: '2024-01-01-120000', message: 'Invalid schema' }]
		const client = createProvider(domainFailure).get()

		const caught = await client.migrate([]).then(() => null, (error: unknown) => error)

		expect(caught).toBe(domainFailure)
	})

	test('preserves migration-domain strings', async () => {
		const domainFailure = 'Migration cannot be modified'
		const client = createProvider(domainFailure).get()

		const caught = await client.migrationModify('2024-01-01-120000', {}).then(() => null, (error: unknown) => error)

		expect(caught).toBe(domainFailure)
	})

	test('does not classify non-GraphQL special errors as transport failures', async () => {
		const domainFailure = new Error('Migration-specific failure')
		const client = createProvider(domainFailure).get()

		const caught = await client.listExecutedMigrations().then(() => null, (error: unknown) => error)

		expect(caught).toBe(domainFailure)
	})
})
