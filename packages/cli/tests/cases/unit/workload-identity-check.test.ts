import { afterEach, describe, expect, test } from 'bun:test'
import { ExitCode } from '@contember/cli-common'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'
import { WorkloadIdentityCheckCommand } from '../../../src/commands/workloadIdentity/WorkloadIdentityCheckCommand.js'
import { staticTokenCredentials } from '../../../src/lib/credentials/ApiCredentials.js'
import { TenantClientProvider } from '../../../src/lib/TenantClientProvider.js'
import { TenantApiTransport } from '../../../src/lib/tenant/TenantApiTransport.js'
import { TenantProjectClient } from '../../../src/lib/tenant/clients/TenantProjectClient.js'

const TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJkaXN0aW5jdGl2ZSJ9.c2lnbmF0dXJl'
const API_URL = 'https://tenant.example.test'

const originalFetch = globalThis.fetch

afterEach(() => {
	globalThis.fetch = originalFetch
})

const stubTenantApi = (data: Record<string, unknown>) => {
	const sent: { query: string; variables: Record<string, unknown> }[] = []
	globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
		sent.push(JSON.parse(String(init?.body)))
		return new Response(JSON.stringify({ data }), { status: 200 })
	}
	return sent
}

const trust = {
	slug: 'sites-sync',
	profile: 'github_actions',
	issuer: 'https://token.actions.githubusercontent.com',
	audience: 'contember:test:sites-sync',
	disabled: false,
}

const createCommand = (stdin = `${TOKEN}\n`) => {
	const provider = new TenantClientProvider({ get: () => ({ endpoint: API_URL, credentials: staticTokenCredentials('admin-token-value') }) })
	return new WorkloadIdentityCheckCommand(provider, async () => stdin)
}

describe('workload-identity check', () => {
	test('requires --token-stdin and never reads stdin without it', async () => {
		let read = false
		const provider = new TenantClientProvider({ get: () => ({ endpoint: API_URL, credentials: staticTokenCredentials('admin-token-value') }) })
		const command = new WorkloadIdentityCheckCommand(provider, async () => {
			read = true
			return TOKEN
		})
		const { output } = createTestOutput()

		await expect(command.run(['--json'], output)).rejects.toMatchObject({ code: 'TOKEN_REQUIRED', exitCode: ExitCode.InputError })
		expect(read).toBe(false)
	})

	test('prints the trust, DPoP requirement and verified claims of an accepted token, never the token', async () => {
		const sent = stubTenantApi({
			checkWorkloadIdentityToken: {
				ok: true,
				trust,
				failure: null,
				claims: { sub: 'repo:acme/sites:environment:production', run_id: '42' },
				requiresDpop: false,
			},
		})
		const { output, stdout, stderr } = createTestOutput()

		expect(await createCommand().run(['--token-stdin'], output)).toBe(ExitCode.Success)

		expect(sent[0]?.variables).toEqual({ token: TOKEN })
		expect(stdout.text).toContain('Trust: sites-sync (github-actions)')
		expect(stdout.text).toContain('Result: accepted')
		expect(stdout.text).toContain('DPoP required: no')
		expect(stdout.text).toContain('"run_id": "42"')
		expect(stdout.text + stderr.text).not.toContain(TOKEN)
	})

	test('explains a failing condition: step, index and the actual claim value', async () => {
		stubTenantApi({
			checkWorkloadIdentityToken: {
				ok: false,
				trust,
				failure: { step: 'condition', message: 'condition 1 does not match', conditionIndex: 1, actualValue: '111' },
				claims: null,
				requiresDpop: null,
			},
		})
		const { output, stdout } = createTestOutput()

		expect(await createCommand().run(['--token-stdin'], output)).toBe(ExitCode.Forbidden)
		expect(stdout.text).toContain('Result: rejected at step condition')
		expect(stdout.text).toContain('Reason: condition 1 does not match')
		expect(stdout.text).toContain('Failing condition: #1')
		expect(stdout.text).toContain('Actual claim value: "111"')
	})

	test('--json prints the check as data and --quiet the failing step', async () => {
		const check = {
			ok: false,
			trust: null,
			failure: { step: 'trust_not_found', message: 'no trust', conditionIndex: null, actualValue: null },
			claims: null,
			requiresDpop: null,
		}
		stubTenantApi({ checkWorkloadIdentityToken: check })

		const json = createTestOutput()
		expect(await createCommand().run(['--token-stdin', '--json'], json.output)).toBe(ExitCode.Forbidden)
		expect(JSON.parse(json.stdout.text)).toEqual(check)
		expect(json.stdout.text).not.toContain(TOKEN)

		const quiet = createTestOutput()
		expect(await createCommand().run(['--token-stdin', '--quiet'], quiet.output)).toBe(ExitCode.Forbidden)
		expect(quiet.stdout.text).toBe('trust_not_found\n')
	})

	test('escapes terminal control sequences coming from token claims', async () => {
		stubTenantApi({
			checkWorkloadIdentityToken: { ok: true, trust, failure: null, claims: { sub: 'evil\u001b[2Jsub' }, requiresDpop: true },
		})
		const { output, stdout } = createTestOutput()

		await createCommand().run(['--token-stdin'], output)

		expect(stdout.text).not.toContain('\u001b[2J')
		expect(stdout.text).toContain('DPoP required: yes')
	})
})

describe('tenant workload identity client', () => {
	const client = () => new TenantProjectClient(TenantApiTransport.create(API_URL, staticTokenCredentials('admin-token-value')))

	test('maps the profile enum and parses stored envelope rules', async () => {
		stubTenantApi({
			workloadIdentityTrusts: [{
				id: 't1',
				slug: 'sites-sync',
				profile: 'github_actions',
				issuer: trust.issuer,
				audience: trust.audience,
				jwksUri: null,
				signingAlgs: ['RS256'],
				acceptedTyp: ['JWT', null],
				acceptAudienceArray: false,
				requireDpop: false,
				conditions: [{ claim: 'repository_id', equals: '1' }],
				maxTokenLifetime: 600,
				trustForwardedInfo: false,
				description: null,
				disabled: false,
				tokensValidAfter: '2026-10-01T00:00:00.000Z',
				roles: [],
				createdAt: '2026-10-01T00:00:00.000Z',
				updatedAt: '2026-10-01T00:00:00.000Z',
				memberships: [{
					project: 'sites',
					role: 'sync',
					variables: [{ name: 'site', values: ['blog'] }],
					assumeMembership: { sync: { variables: { site: 'site' } } },
				}],
			}],
		})

		const [listed] = await client().listWorkloadIdentityTrusts()

		expect(listed?.profile).toBe('github-actions')
		expect(listed?.acceptedTyp).toEqual(['JWT', null])
		expect(listed?.memberships[0]?.assumeMembership).toEqual({ sync: { variables: { site: 'site' } } })
	})

	test('a refused apply carries the error code, developer message and per-item details', async () => {
		const details = [{ index: 0, message: '`repository_id` is a string claim' }]
		stubTenantApi({
			applyWorkloadIdentityTrust: { ok: false, error: { code: 'INVALID_CONDITIONS', developerMessage: 'invalid conditions', details }, result: null },
		})

		const promise = client().applyWorkloadIdentityTrust('sites-sync', {
			profile: 'github_actions',
			issuer: trust.issuer,
			audience: trust.audience,
			conditions: [{ claim: 'repository_id', equals: 1 }],
		})

		await expect(promise).rejects.toMatchObject({
			code: 'INVALID_CONDITIONS',
			exitCode: ExitCode.InputError,
			details: {
				operation: 'applyWorkloadIdentityTrust(sites-sync)',
				code: 'INVALID_CONDITIONS',
				developerMessage: 'invalid conditions',
				errorDetails: details,
			},
		})
		await expect(promise).rejects.toThrow(/`repository_id` is a string claim/)
	})
})
