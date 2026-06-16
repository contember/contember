import { describe, expect, test } from 'bun:test'
import { handleOIDCResponse } from '../../../../src/model/service/idp/providers/OIDCHelpers.js'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'

/** A stub openid-client whose `callback` yields the given id-token claims and `userinfo` the given object. */
const stubClient = (idTokenClaims: Record<string, unknown>, userInfo?: Record<string, unknown>) =>
	({
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

describe('handleOIDCResponse — externalIdentifier scalar guard', () => {
	// The federation key is persisted and matched on the next sign-in; a non-scalar coerced via
	// String() would collapse every user of the provider onto one key, so we fail closed.
	test('rejects a mapped subject that is an object', async () => {
		const client = stubClient({ sub: 's', obj: { a: 1 } })
		await expect(handleOIDCResponse(client, responseData, { claimMapping: { externalIdentifier: 'obj' } }))
			.rejects.toThrow(IDPValidationError)
	})

	test('rejects a mapped subject that is an array', async () => {
		const client = stubClient({ sub: 's', list: ['a', 'b'] })
		await expect(handleOIDCResponse(client, responseData, { claimMapping: { externalIdentifier: 'list' } }))
			.rejects.toThrow(IDPValidationError)
	})

	test('accepts a numeric mapped subject, coercing it to its string form', async () => {
		const client = stubClient({ sub: 's', uid: 12345 })
		const result = await handleOIDCResponse(client, responseData, { claimMapping: { externalIdentifier: 'uid' } })
		expect(result.externalIdentifier).toBe('12345')
	})

	test('rejects a mapped subject that resolves to an empty string', async () => {
		const client = stubClient({ sub: 's', oid: '' })
		await expect(handleOIDCResponse(client, responseData, { claimMapping: { externalIdentifier: 'oid' } }))
			.rejects.toThrow(IDPValidationError)
	})

	test('rejects an empty `sub` on the default path', async () => {
		const client = stubClient({ sub: '' })
		await expect(handleOIDCResponse(client, responseData))
			.rejects.toThrow(IDPValidationError)
	})
})

describe('handleOIDCResponse — signed claims win over unwrapped attributes', () => {
	// `attributes` come from the unsigned userinfo response; they must not override a claim already
	// present in the signature-verified ID-token / userInfo merge.
	test('a signed id_token `sub` is not overridden by an attributes-level `sub`', async () => {
		const client = stubClient(
			{ sub: 'signed-subject' },
			{ sub: 'signed-subject', attributes: { sub: 'spoofed-subject', email: 'a@b.cz' } },
		)
		const result = await handleOIDCResponse(client, responseData, {
			fetchUserInfo: true,
			claimMapping: { attributesKey: 'attributes' },
		})
		expect(result.externalIdentifier).toBe('signed-subject')
	})

	test('a top-level email_verified is not overridden by an attributes-level one', async () => {
		const client = stubClient(
			{ sub: 's' },
			{ sub: 's', email_verified: false, attributes: { email: 'a@b.cz', email_verified: 'true' } },
		)
		const result = await handleOIDCResponse(client, responseData, {
			fetchUserInfo: true,
			claimMapping: { attributesKey: 'attributes' },
		})
		expect(result.emailVerified).toBe(false)
	})
})

describe('handleOIDCResponse — non-string email/name do not leak', () => {
	// A non-string `email` claim must be dropped, not passed through `...source` — it would
	// otherwise reach the by-e-mail lookup and crash normalizeEmail (TypeError -> 500).
	test('a non-string e-mail claim is dropped to undefined, not leaked', async () => {
		const client = stubClient({ sub: 's', email: ['a@b.cz', 'c@d.cz'] })
		const result = await handleOIDCResponse(client, responseData)
		expect(result.email).toBeUndefined()
	})
})
