import { describe, expect, test } from 'bun:test'
import { buildSignInClaims } from '../../../../src/model/service/idp/providers/OIDCHelpers.js'
import { OIDCClaimMapping } from '../../../../src/model/service/idp/providers/OIDCTypes.js'
import { IDPValidationError } from '../../../../src/model/service/idp/IDPValidationError.js'

/** What a sign-in validated: the ID-token claims, and the userinfo response when `fetchUserInfo` is on. */
const stubClient = (idTokenClaims: { sub: string } & Record<string, unknown>, userInfo?: Record<string, unknown>) => ({ idTokenClaims, userInfo })

/** The claims a sign-in returns for them (the protocol part is covered by the oidcHarness tests). */
const signInClaims = async (
	{ idTokenClaims, userInfo }: ReturnType<typeof stubClient>,
	{ fetchUserInfo, claimMapping }: { fetchUserInfo?: boolean; claimMapping?: OIDCClaimMapping } = {},
) => buildSignInClaims(idTokenClaims, fetchUserInfo && userInfo ? userInfo : {}, claimMapping)

describe('sign-in claims — claim mapping', () => {
	test('defaults: subject from `sub`, e-mail from `email`', async () => {
		const client = stubClient({ sub: 'jan.novak@example.com', email: 'jan.novak@example.com', given_name: 'Jan' })
		const result = await signInClaims(client)
		expect(result.externalIdentifier).toBe('jan.novak@example.com')
		expect(result.email).toBe('jan.novak@example.com')
	})

	test('maps the external identifier to a stable claim (oid) from a flat id_token', async () => {
		const client = stubClient({ sub: 'jan.novak@example.com', email: 'jan.novak@example.com', oid: 'cf0f5802-4afa-42bf' })
		const result = await signInClaims(client, { claimMapping: { externalIdentifier: 'oid' } })
		expect(result.externalIdentifier).toBe('cf0f5802-4afa-42bf')
		expect(result.email).toBe('jan.novak@example.com')
	})

	test('unwraps userinfo claims nested under `attributes` (Apereo CAS shape)', async () => {
		const client = stubClient(
			{ sub: 'jan.novak@example.com' },
			{
				sub: 'jan.novak@example.com',
				attributes: { oid: 'cf0f5802-4afa-42bf', email: 'jan.novak@example.com', given_name: 'Jan', family_name: 'Novák' },
			},
		)
		const result = await signInClaims(client, {
			fetchUserInfo: true,
			claimMapping: { externalIdentifier: 'oid', attributesKey: 'attributes' },
		})
		expect(result.externalIdentifier).toBe('cf0f5802-4afa-42bf')
		expect(result.email).toBe('jan.novak@example.com')
		expect(result.given_name).toBe('Jan')
	})

	test('dot-path mapping reaches into a nested claim without unwrapping', async () => {
		const client = stubClient({ sub: 's', user: { id: 'nested-id' } })
		const result = await signInClaims(client, { claimMapping: { externalIdentifier: 'user.id' } })
		expect(result.externalIdentifier).toBe('nested-id')
	})

	test('falls back to `sub` when the mapped subject claim is absent', async () => {
		const client = stubClient({ sub: 'fallback-sub' })
		const result = await signInClaims(client, { claimMapping: { externalIdentifier: 'oid' } })
		expect(result.externalIdentifier).toBe('fallback-sub')
	})

	test('email_verified is read from unwrapped attributes (string "true" accepted)', async () => {
		const client = stubClient(
			{ sub: 's' },
			{ sub: 's', attributes: { email: 'jane@example.com', email_verified: 'true' } },
		)
		const result = await signInClaims(client, {
			fetchUserInfo: true,
			claimMapping: { attributesKey: 'attributes' },
		})
		expect(result.emailVerified).toBe(true)
	})
})

describe('sign-in claims — externalIdentifier scalar guard', () => {
	// The federation key is persisted and matched on the next sign-in; a non-scalar coerced via
	// String() would collapse every user of the provider onto one key, so we fail closed.
	test('rejects a mapped subject that is an object', async () => {
		const client = stubClient({ sub: 's', obj: { a: 1 } })
		await expect(signInClaims(client, { claimMapping: { externalIdentifier: 'obj' } }))
			.rejects.toThrow(IDPValidationError)
	})

	test('rejects a mapped subject that is an array', async () => {
		const client = stubClient({ sub: 's', list: ['a', 'b'] })
		await expect(signInClaims(client, { claimMapping: { externalIdentifier: 'list' } }))
			.rejects.toThrow(IDPValidationError)
	})

	test('accepts a numeric mapped subject, coercing it to its string form', async () => {
		const client = stubClient({ sub: 's', uid: 12345 })
		const result = await signInClaims(client, { claimMapping: { externalIdentifier: 'uid' } })
		expect(result.externalIdentifier).toBe('12345')
	})

	test('rejects a mapped subject that resolves to an empty string', async () => {
		const client = stubClient({ sub: 's', oid: '' })
		await expect(signInClaims(client, { claimMapping: { externalIdentifier: 'oid' } }))
			.rejects.toThrow(IDPValidationError)
	})

	test('rejects an empty `sub` on the default path', async () => {
		const client = stubClient({ sub: '' })
		await expect(signInClaims(client))
			.rejects.toThrow(IDPValidationError)
	})
})

describe('sign-in claims — signed claims win over unwrapped attributes', () => {
	// `attributes` come from the unsigned userinfo response; they must not override a claim already
	// present in the signature-verified ID-token / userInfo merge.
	test('a signed id_token `sub` is not overridden by an attributes-level `sub`', async () => {
		const client = stubClient(
			{ sub: 'signed-subject' },
			{ sub: 'signed-subject', attributes: { sub: 'spoofed-subject', email: 'jane@example.com' } },
		)
		const result = await signInClaims(client, {
			fetchUserInfo: true,
			claimMapping: { attributesKey: 'attributes' },
		})
		expect(result.externalIdentifier).toBe('signed-subject')
	})

	test('a top-level email_verified is not overridden by an attributes-level one', async () => {
		const client = stubClient(
			{ sub: 's' },
			{ sub: 's', email_verified: false, attributes: { email: 'jane@example.com', email_verified: 'true' } },
		)
		const result = await signInClaims(client, {
			fetchUserInfo: true,
			claimMapping: { attributesKey: 'attributes' },
		})
		expect(result.emailVerified).toBe(false)
	})
})

describe('sign-in claims — non-string email/name do not leak', () => {
	// A non-string `email` claim must be dropped, not passed through `...source` — it would
	// otherwise reach the by-e-mail lookup and crash normalizeEmail (TypeError -> 500).
	test('a non-string e-mail claim is dropped to undefined, not leaked', async () => {
		const client = stubClient({ sub: 's', email: ['jane@example.com', 'c@d.cz'] })
		const result = await signInClaims(client)
		expect(result.email).toBeUndefined()
	})
})

describe('sign-in claims — display name', () => {
	// `name` is optional in OIDC core and several providers (Apereo CAS, Entra ID, Keycloak under its
	// default mappers) omit it while sending the parts. Without the fallback CreatePersonCommand lands
	// on its own last-resort default and the person ends up named after their e-mail's local part.
	test('composes the name from given_name + family_name when there is no `name` claim', async () => {
		const client = stubClient({ sub: 's', email: 'jan@example.com', given_name: 'Jan', family_name: 'Novák' })
		const result = await signInClaims(client)
		expect(result.name).toBe('Jan Novák')
	})

	test('an explicit `name` claim still wins over the parts', async () => {
		const client = stubClient({ sub: 's', name: 'Jan Novák ml.', given_name: 'Jan', family_name: 'Novák' })
		const result = await signInClaims(client)
		expect(result.name).toBe('Jan Novák ml.')
	})

	test('only one part present → that part alone, no stray whitespace', async () => {
		expect((await signInClaims(stubClient({ sub: 's', given_name: 'Jan' }))).name).toBe('Jan')
		expect((await signInClaims(stubClient({ sub: 's', family_name: 'Novák' }))).name).toBe('Novák')
	})

	test('blank / non-string parts are ignored rather than composed into whitespace', async () => {
		expect((await signInClaims(stubClient({ sub: 's', given_name: '  ', family_name: '' }))).name)
			.toBeUndefined()
		expect((await signInClaims(stubClient({ sub: 's', given_name: ['Jan'], family_name: 3 }))).name)
			.toBeUndefined()
	})

	test('a blank `name` claim falls back to the parts', async () => {
		const client = stubClient({ sub: 's', name: '   ', given_name: 'Jan', family_name: 'Novák' })
		expect((await signInClaims(client)).name).toBe('Jan Novák')
	})

	test('an explicitly mapped name claim is honoured as-is — no silent substitution', async () => {
		// Mapping a claim states where the name lives; falling back to other claims would defeat that.
		const client = stubClient({ sub: 's', displayName: 'Jan N.', given_name: 'Jan', family_name: 'Novák' })
		expect((await signInClaims(client, { claimMapping: { name: 'displayName' } })).name).toBe('Jan N.')
		const missing = stubClient({ sub: 's', given_name: 'Jan', family_name: 'Novák' })
		expect((await signInClaims(missing, { claimMapping: { name: 'displayName' } })).name).toBeUndefined()
	})

	test('the parts are read after attributes-lifting, so a CAS-shaped userinfo works', async () => {
		const client = stubClient(
			{ sub: 's' },
			{ sub: 's', attributes: { given_name: 'Jan', family_name: 'Novák' } },
		)
		const result = await signInClaims(client, {
			fetchUserInfo: true,
			claimMapping: { attributesKey: 'attributes' },
		})
		expect(result.name).toBe('Jan Novák')
	})
})
