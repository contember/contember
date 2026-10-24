import { expect, test } from 'bun:test'
import { AuthLogService, WorkloadJwksRegistry, WorkloadKeySource, WorkloadTokenVerifier } from '../../../../../src/index.js'
import { createDb, instanceConfig } from './testIssuer.js'

const NOW = new Date('2026-10-24T12:00:00Z')

test('a workload success row is an insert-or-ignore carrying trust_id and token_ref', async () => {
	const queries = [{
		sql:
			`insert into "tenant"."person_auth_log" ("id", "invoked_by_id", "type", "success", "metadata", "event_data", "trust_id", "token_ref") values (?, ?, ?, ?, ?, ?, ?, ?) on conflict do nothing`,
		parameters: [
			() => true,
			'identity-1',
			'workload_auth_success',
			true,
			{ trustSlug: 'web-backend' },
			{ sub: 'web-backend' },
			'trust-1',
			'token-1',
		],
		response: { rowCount: 1 },
	}]
	await new AuthLogService().logWorkloadAuth(createDb(queries, NOW), {
		success: true,
		trustId: 'trust-1',
		identityId: 'identity-1',
		tokenRef: 'token-1',
		metadata: { trustSlug: 'web-backend' },
		eventData: { sub: 'web-backend' },
	})
	expect(queries).toHaveLength(0)
})

test('a workload failure row is a plain insert with the category as error code', async () => {
	const queries = [{
		sql:
			`insert into "tenant"."person_auth_log" ("id", "type", "success", "error_code", "error_message", "ip_address", "metadata", "trust_id") values (?, ?, ?, ?, ?, ?, ?, ?)`,
		parameters: [
			() => true,
			'workload_auth_failure',
			false,
			'condition',
			'Condition #0 does not match',
			'203.0.113.1',
			{ unverified_sub: 'x' },
			'trust-1',
		],
		response: { rowCount: 1 },
	}]
	await new AuthLogService().logWorkloadAuth(createDb(queries, NOW), {
		success: false,
		trustId: 'trust-1',
		errorCode: 'condition',
		errorMessage: 'Condition #0 does not match',
		ipAddress: '203.0.113.1',
		metadata: { unverified_sub: 'x' },
	})
	expect(queries).toHaveLength(0)
})

test('prewarm hands the enabled trusts key sources to the registry', async () => {
	const sources: WorkloadKeySource[] = []
	class RecordingRegistry extends WorkloadJwksRegistry {
		override async prewarm(input: readonly WorkloadKeySource[]): Promise<void> {
			sources.push(...input)
		}
	}
	const registry = new RecordingRegistry(instanceConfig)
	const queries = [{
		sql:
			`select distinct "workload_identity_trust"."issuer", "workload_identity_trust"."jwks_uri" from "tenant"."workload_identity_trust" where "workload_identity_trust"."disabled_at" is null`,
		parameters: [],
		response: {
			rows: [{ issuer: 'https://a.example', jwks_uri: null }, { issuer: 'https://b.example', jwks_uri: 'https://b.example/keys' }],
			rowCount: 2,
		},
	}]
	const verifier = new WorkloadTokenVerifier(
		registry,
		{ verification: () => {}, jwksFetchFailure: () => {}, unknownKid: () => {} },
		new AuthLogService(),
		{ now: () => NOW },
	)
	await verifier.prewarm(createDb(queries, NOW))
	registry.dispose()
	expect(queries).toHaveLength(0)
	expect(sources).toEqual([{ issuer: 'https://a.example', jwksUri: null }, { issuer: 'https://b.example', jwksUri: 'https://b.example/keys' }])
})
