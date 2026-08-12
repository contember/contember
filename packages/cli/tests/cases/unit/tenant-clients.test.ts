import { describe, expect, test } from 'bun:test'
import { CliError, ExitCode } from '@contember/cli-common'
import { GraphQlClient } from '@contember/graphql-client'
import { TenantApiTransport } from '../../../src/lib/tenant/TenantApiTransport.js'
import { createTenantClients } from '../../../src/lib/tenant/clients/index.js'

interface CapturedRequest {
	query: string
	variables: unknown
}

/** Answers every request with `data`, capturing what was sent. */
const createClients = (data: unknown) => {
	const requests: CapturedRequest[] = []
	const client = new GraphQlClient({
		url: 'http://localhost:1481/tenant',
		fetcher: async (input, init) => {
			const { query, variables }: { query: string; variables: unknown } = JSON.parse(String(init?.body))
			requests.push({ query, variables })
			return new Response(JSON.stringify({ data }), { status: 200 })
		},
	})
	return { clients: createTenantClients(new TenantApiTransport(client)), requests }
}

describe('TenantProjectClient', () => {
	test('createProject sends the slug', async () => {
		const { clients, requests } = createClients({ createProject: { ok: true } })
		await clients.project.createProject('blog')

		expect(requests[0].variables).toEqual({ projectSlug: 'blog' })
		expect(requests[0].query).toContain('createProject')
	})

	test('createProject swallows ALREADY_EXISTS when asked to', async () => {
		const { clients } = createClients({ createProject: { ok: false, error: { code: 'ALREADY_EXISTS', developerMessage: 'exists' } } })
		await clients.project.createProject('blog', true)
	})

	test('createProject reports ALREADY_EXISTS as a conflict otherwise', async () => {
		const { clients } = createClients({ createProject: { ok: false, error: { code: 'ALREADY_EXISTS', developerMessage: 'exists' } } })

		try {
			await clients.project.createProject('blog')
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('ALREADY_EXISTS')
				expect(e.exitCode).toBe(ExitCode.Conflict)
			}
		}
	})

	test('listIdentityProviders normalizes disabledAt to null', async () => {
		const { clients } = createClients({ identityProviders: [{ slug: 'google', type: 'oidc' }] })

		expect(await clients.project.listIdentityProviders()).toEqual([{ slug: 'google', type: 'oidc', disabledAt: null }])
	})
})

describe('TenantPersonClient', () => {
	test('listPersons flattens the identity and normalizes nullables', async () => {
		const { clients, requests } = createClients({
			persons: [{ id: 'p1', email: 'a@b.cz', otpEnabled: true, emailOtpEnabled: false, emailVerified: true, identity: { id: 'i1' } }],
		})

		const persons = await clients.person.listPersons({ limit: 10 })

		expect(persons).toEqual([{
			id: 'p1',
			identityId: 'i1',
			email: 'a@b.cz',
			name: null,
			otpEnabled: true,
			emailOtpEnabled: false,
			emailVerified: true,
		}])
		expect(requests[0].variables).toEqual({ filter: undefined, limit: 10, offset: undefined })
	})
})

describe('TenantMemberClient', () => {
	test('listProjectMemberships sends both keys', async () => {
		const { clients, requests } = createClients({ projectMemberships: [{ role: 'editor', variables: [{ name: 'language', values: ['cs'] }] }] })

		const memberships = await clients.member.listProjectMemberships('blog', 'i1')

		expect(memberships).toEqual([{ role: 'editor', variables: [{ name: 'language', values: ['cs'] }] }])
		expect(requests[0].variables).toEqual({ projectSlug: 'blog', identityId: 'i1' })
	})
})

describe('TenantApiKeyClient', () => {
	test('listGlobalApiKeys normalizes nullables', async () => {
		const { clients } = createClients({ globalApiKeys: [{ id: 'k1', type: 'PERMANENT', enabled: true }] })

		expect(await clients.apiKey.listGlobalApiKeys()).toEqual([{
			id: 'k1',
			description: null,
			type: 'PERMANENT',
			enabled: true,
			createdAt: null,
			lastUsedAt: null,
			expiresAt: null,
		}])
	})
})

describe('TenantPolicyClient', () => {
	test('addMailTemplate reports a failing payload with the operation label', async () => {
		const { clients } = createClients({ addMailTemplate: { ok: false, error: { code: 'PROJECT_NOT_FOUND', developerMessage: 'no such project' } } })

		try {
			await clients.policy.addMailTemplate({ type: 'RESET_PASSWORD_REQUEST', subject: 's', content: 'c', variant: 'cs' })
			throw new Error('expected a CliError to be thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(CliError)
			if (e instanceof CliError) {
				expect(e.code).toBe('PROJECT_NOT_FOUND')
				expect(e.exitCode).toBe(ExitCode.NotFound)
				expect(e.message).toContain('addMailTemplate(RESET_PASSWORD_REQUEST/cs)')
			}
		}
	})
})
