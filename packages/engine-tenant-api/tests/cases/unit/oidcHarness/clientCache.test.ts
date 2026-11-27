import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { FakeIdp } from './FakeIdp.js'
import { configurationFor, REDIRECT_URL, useRuntimeGlobals } from './harness.js'

/** Discovery runs once per configuration and provider instance; the cache keeps the 100 most recently used clients. */
describe('discovered client cache', () => {
	useRuntimeGlobals()

	let idp: FakeIdp

	beforeAll(async () => {
		idp = await FakeIdp.start()
	})
	afterAll(async () => {
		await idp.stop()
	})
	beforeEach(() => {
		idp.reset()
	})

	// the client secret is part of the cache key, so each secret is a configuration of its own
	const init = async (provider: OIDCProvider, clientSecret: string) =>
		await provider.initAuth(configurationFor(idp, { clientSecret }), { redirectUrl: REDIRECT_URL })
	const discoveries = () => idp.requestsTo('discovery').length

	test('the least recently used client is evicted, not the oldest', async () => {
		const provider = new OIDCProvider(null, null)
		await init(provider, 'a')
		for (let i = 1; i <= 99; i++) {
			await init(provider, `s${i}`)
		}
		await init(provider, 'a')
		expect(discoveries()).toBe(100)

		await init(provider, 's100')
		await init(provider, 'a')
		expect(discoveries()).toBe(101)

		await init(provider, 's1')
		expect(discoveries()).toBe(102)
	})

	test('a failed discovery is retried on the next call', async () => {
		const provider = new OIDCProvider(null, null)
		idp.override('discovery', { kind: 'respond', status: 500, body: 'boom' })

		await expect(init(provider, 'a')).rejects.toThrow()
		idp.reset()
		await init(provider, 'a')
		await init(provider, 'a')

		expect(discoveries()).toBe(1)
	})
})
