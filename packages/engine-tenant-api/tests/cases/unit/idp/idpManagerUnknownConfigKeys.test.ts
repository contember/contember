import { describe, expect, test } from 'bun:test'
import { IDPHandlerRegistry, IDPManager } from '../../../../src/model/service/idp/index.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { DatabaseContext } from '../../../../src/index.js'

// Provider configurations are parsed with `Typesafe.partial`, which DROPS unknown properties. Without a
// write-time guard, `addIDP` / `updateIDP` answer `ok` to a configuration the provider will never act on:
// a typo such as `fetchUserinfo` (lowercase i) reads as an applied setting while the option stays off.
// These pin the rejection. `OIDCProvider.validateConfiguration` is pure Typesafe parsing (no discovery,
// no network), so the real provider can be used here rather than a pass-through double.

const OIDC_BASE = { url: 'https://idp.example.com', clientId: 'client', clientSecret: 'secret' }
const OPTIONS = { autoSignUp: false, exclusive: false, initReturnsConfig: false, requireVerifiedEmail: false, assumeEmailVerified: false }

const makeManager = () => {
	const registry = new IDPHandlerRegistry()
	registry.registerHandler('oidc', new OIDCProvider())
	return new IDPManager(registry, { getSchema: () => Promise.resolve(undefined) })
}

/** `existing` undefined ⇒ no IdP with that slug yet (the addIDP path). */
const makeDb = (existing?: Record<string, unknown>) => {
	const executed: unknown[] = []
	const inner: any = {
		queryHandler: {
			fetch: async () => existing ? { id: 'idp-1', slug: 'sso', type: 'oidc', configuration: existing, disabledAt: null } : undefined,
		},
		commandBus: { execute: async (command: unknown) => void executed.push(command) },
	}
	inner.transaction = async (cb: (db: any) => Promise<unknown>) => cb(inner)
	return { db: inner as unknown as DatabaseContext, executed }
}

describe('IDPManager — unknown configuration keys', () => {
	test('addIDP rejects a key the provider would silently ignore', async () => {
		const { db, executed } = makeDb()
		const response = await makeManager().addIDP(db, {
			slug: 'sso',
			type: 'oidc',
			// `fetchUserinfo` is a plausible typo of `fetchUserInfo`; before the guard this returned ok
			// and left the option off.
			configuration: { ...OIDC_BASE, fetchUserinfo: true },
			options: OPTIONS,
		})

		expect(response.ok).toBe(false)
		expect(response.ok === false && response.error).toBe('INVALID_CONFIGURATION')
		expect(response.ok === false && response.errorMessage).toContain('fetchUserinfo')
		// nothing was written
		expect(executed).toHaveLength(0)
	})

	test('reports every unknown key at once, so several typos take one round trip', async () => {
		const { db } = makeDb()
		const response = await makeManager().addIDP(db, {
			slug: 'sso',
			type: 'oidc',
			configuration: { ...OIDC_BASE, fetchUserinfo: true, tokenEndpointAuthMethd: 'client_secret_post' },
			options: OPTIONS,
		})

		expect(response.ok).toBe(false)
		const message = response.ok === false ? response.errorMessage ?? '' : ''
		expect(message).toContain('fetchUserinfo')
		expect(message).toContain('tokenEndpointAuthMethd')
	})

	test('a configuration the provider fully understands still passes', async () => {
		const { db, executed } = makeDb()
		const response = await makeManager().addIDP(db, {
			slug: 'sso',
			type: 'oidc',
			configuration: { ...OIDC_BASE, scope: 'openid email', fetchUserInfo: true },
			options: OPTIONS,
		})

		expect(response.ok).toBe(true)
		expect(executed).toHaveLength(1)
	})

	test('updateIDP rejects an unknown key in the MERGED result, not just in the patch', async () => {
		const { db, executed } = makeDb(OIDC_BASE)
		const response = await makeManager().updateIDP(db, 'sso', { configuration: { fetchUserinfo: true } }, true)

		expect(response.ok).toBe(false)
		expect(response.ok === false && response.error).toBe('INVALID_CONFIGURATION')
		expect(response.ok === false && response.errorMessage).toContain('fetchUserinfo')
		expect(executed).toHaveLength(0)
	})

	test('an update that does not touch the configuration is not re-validated', async () => {
		// A row written before this guard may hold keys the provider ignores. Toggling something else
		// about it must not become impossible — the guard is a write-time check on a submitted
		// configuration, not a re-validation of what is already stored.
		const { db, executed } = makeDb({ ...OIDC_BASE, legacyIgnoredKey: true })
		const response = await makeManager().updateIDP(db, 'sso', { options: { autoSignUp: true } }, false)

		expect(response.ok).toBe(true)
		expect(executed).toHaveLength(1)
	})
})
