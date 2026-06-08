import { describe, expect, test } from 'bun:test'
import { handleOIDCResponse } from '../../../../src/model/service/idp/providers/OIDCHelpers.js'

/** A stub openid-client whose `callback` yields the given id-token claims and `userinfo` the given object. */
const stubClient = (idTokenClaims: Record<string, unknown>, userInfo?: Record<string, unknown>) => ({
	callback: async () => ({
		access_token: 'access-token',
		claims: () => idTokenClaims,
	}),
	userinfo: async () => userInfo ?? {},
}) as any

const responseData = { parameters: {}, redirectUrl: 'https://app.example.com/cb' }

describe('handleOIDCResponse — claim mapping', () => {
	test('defaults: subject from `sub`, e-mail from `email`', async () => {
		const client = stubClient({ sub: 'jan.pokusny@npi.cz', email: 'jan.pokusny@npi.cz', given_name: 'Jan' })
		const result = await handleOIDCResponse(client, responseData)
		expect(result.externalIdentifier).toBe('jan.pokusny@npi.cz')
		expect(result.email).toBe('jan.pokusny@npi.cz')
	})

	test('maps the external identifier to a stable claim (oid) from a flat id_token', async () => {
		const client = stubClient({ sub: 'jan.pokusny@npi.cz', email: 'jan.pokusny@npi.cz', oid: 'cf0f5802-4afa-42bf' })
		const result = await handleOIDCResponse(client, responseData, { claimMapping: { externalIdentifier: 'oid' } })
		expect(result.externalIdentifier).toBe('cf0f5802-4afa-42bf')
		expect(result.email).toBe('jan.pokusny@npi.cz')
	})

	test('unwraps userinfo claims nested under `attributes` (Apereo CAS shape)', async () => {
		const client = stubClient(
			{ sub: 'jan.pokusny@npi.cz' },
			{
				sub: 'jan.pokusny@npi.cz',
				attributes: { oid: 'cf0f5802-4afa-42bf', email: 'jan.pokusny@npi.cz', given_name: 'Jan', family_name: 'Pokusný' },
			},
		)
		const result = await handleOIDCResponse(client, responseData, {
			fetchUserInfo: true,
			claimMapping: { externalIdentifier: 'oid', attributesKey: 'attributes' },
		})
		expect(result.externalIdentifier).toBe('cf0f5802-4afa-42bf')
		expect(result.email).toBe('jan.pokusny@npi.cz')
		expect(result.given_name).toBe('Jan')
	})

	test('dot-path mapping reaches into a nested claim without unwrapping', async () => {
		const client = stubClient({ sub: 's', user: { id: 'nested-id' } })
		const result = await handleOIDCResponse(client, responseData, { claimMapping: { externalIdentifier: 'user.id' } })
		expect(result.externalIdentifier).toBe('nested-id')
	})

	test('falls back to `sub` when the mapped subject claim is absent', async () => {
		const client = stubClient({ sub: 'fallback-sub' })
		const result = await handleOIDCResponse(client, responseData, { claimMapping: { externalIdentifier: 'oid' } })
		expect(result.externalIdentifier).toBe('fallback-sub')
	})

	test('email_verified is read from unwrapped attributes (string "true" accepted)', async () => {
		const client = stubClient(
			{ sub: 's' },
			{ sub: 's', attributes: { email: 'a@b.cz', email_verified: 'true' } },
		)
		const result = await handleOIDCResponse(client, responseData, {
			fetchUserInfo: true,
			claimMapping: { attributesKey: 'attributes' },
		})
		expect(result.emailVerified).toBe(true)
	})
})
