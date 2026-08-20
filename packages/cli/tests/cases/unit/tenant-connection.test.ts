import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { CliError, ExitCode } from '@contember/cli-common'
import { join } from 'node:path'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'
import { createContainer } from '../../../src/dic.js'
import { TenantConnectionProvider } from '../../../src/lib/tenant/TenantConnectionProvider.js'
import { TenantConnectionResolver } from '../../../src/lib/tenant/TenantConnectionResolver.js'
import type { Workspace } from '../../../src/lib/workspace/Workspace.js'

const token = 'x'.repeat(40)

describe('tenant connection', () => {
	test('resolves API environment variables without a project and normalizes the endpoint', () => {
		const connection = new TenantConnectionResolver({
			apiUrl: 'https://team.contember.cloud/',
			apiToken: token,
		}).resolve()

		expect(connection?.endpoint).toBe('https://team.contember.cloud/_api')
		expect(connection?.token.length).toBeGreaterThan(0)
	})

	test('resolves a DSN without requiring its project username', () => {
		const connection = new TenantConnectionResolver({
			dsn: `contember://:${token}@tenant.example.test`,
		}).resolve()

		expect(connection?.endpoint).toBe('https://tenant.example.test')
		expect(connection?.token.length).toBeGreaterThan(0)
	})

	test('reports a typed input error when endpoint or token is missing at provider access', () => {
		for (const env of [{ apiUrl: 'https://tenant.example.test' }, { apiToken: token }]) {
			const provider = new TenantConnectionProvider(new TenantConnectionResolver(env))

			expect(() => provider.get()).toThrow(CliError)
			try {
				provider.get()
			} catch (error) {
				expect(error).toMatchObject({
					code: 'TENANT_CONNECTION_NOT_DEFINED',
					exitCode: ExitCode.InputError,
				})
			}
		}
	})
})

const originalFetch = globalThis.fetch
let requestedUrl: string | undefined

beforeAll(() => {
	globalThis.fetch = async (input: RequestInfo | URL) => {
		requestedUrl = input instanceof Request ? input.url : input.toString()
		return new Response(JSON.stringify({ data: { projects: [] } }), { status: 200 })
	}
})

afterAll(() => {
	globalThis.fetch = originalFetch
})

beforeEach(() => {
	requestedUrl = undefined
})

describe('tenant command connection wiring', () => {
	test('reaches the Tenant API without CONTEMBER_PROJECT_NAME', async () => {
		const workspaceDir = '/nonexistent-workspace'
		const workspace: Workspace = {
			baseDir: workspaceDir,
			apiDir: join(workspaceDir, 'api'),
			migrationsDir: join(workspaceDir, 'api/migrations'),
		}
		const { output, stdout, stderr } = createTestOutput()
		const dic = createContainer({
			env: { apiUrl: 'https://tenant.example.test/', apiToken: token },
			version: '0.0.0-test',
			runtime: 'node',
			workspace,
			output,
		})

		const exitCode = await dic.application.execute(['tenant', 'project', 'list', '--json'])

		expect(exitCode).toBe(0)
		expect(requestedUrl).toBe('https://tenant.example.test/tenant')
		expect(JSON.parse(stdout.text)).toEqual([])
		expect(stderr.text).toBe('')
	})
})
