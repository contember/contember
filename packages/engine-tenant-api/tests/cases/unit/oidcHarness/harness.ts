import { afterAll, afterEach, beforeAll, beforeEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { createHmac } from 'node:crypto'
import { DataSigner } from '../../../../src/index.js'
import { IDPResponse, InitIDPAuthResult } from '../../../../src/model/service/idp/IdentityProviderHandler.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { OIDCConfiguration } from '../../../../src/model/service/idp/providers/OIDCTypes.js'
import { FakeIdp, FakeIdpAuthorization } from './FakeIdp.js'

type GlobalProperties = Map<PropertyKey, PropertyDescriptor | undefined>

const globalProperties = (): GlobalProperties =>
	new Map(Reflect.ownKeys(globalThis).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))

const sameDescriptor = (a: PropertyDescriptor | undefined, b: PropertyDescriptor | undefined): boolean =>
	a === undefined || b === undefined ? a === b : a.value === b.value && a.get === b.get && a.set === b.set

const applyGlobals = (keys: readonly PropertyKey[], properties: GlobalProperties): void => {
	for (const key of keys) {
		const descriptor = properties.get(key)
		if (descriptor === undefined) {
			Reflect.deleteProperty(globalThis, key)
		} else {
			Object.defineProperty(globalThis, key, { ...descriptor, configurable: true })
		}
	}
}

/** The global properties the test preload's happy-dom replaces, with their happy-dom and runtime values. */
type GlobalsSwap = { keys: readonly PropertyKey[]; happyDom: GlobalProperties; runtime: GlobalProperties }
let globalsSwap: GlobalsSwap | undefined

const captureGlobalsSwap = async (): Promise<GlobalsSwap> => {
	const happyDom = globalProperties()
	// unregistering closes the window, whose document modules loaded by earlier test files still hold
	Object.defineProperty(globalThis, 'happyDOM', { value: undefined, configurable: true })
	await GlobalRegistrator.unregister()
	const runtime = globalProperties()
	// a non-configurable property is the runtime's own, settled between the two snapshots, never one happy-dom defined
	const keys = [...new Set([...happyDom.keys(), ...runtime.keys()])].filter(key =>
		!sameDescriptor(happyDom.get(key), runtime.get(key)) && happyDom.get(key)?.configurable !== false && runtime.get(key)?.configurable !== false
	)
	return { keys, happyDom, runtime }
}

/**
 * Runs the enclosing tests with the runtime's globals, as the engine runs, by lifting the test preload's happy-dom for
 * them. Its `fetch` enforces the browser's same-origin policy, and openid-client's `instanceof` checks fail between its
 * `URL`, `Response` and `DOMException` and the runtime's. Test files run one after another in one global object, so
 * the same happy-dom window is put back afterwards.
 */
export const useRuntimeGlobals = (): void => {
	beforeAll(async () => {
		if (globalsSwap === undefined) {
			globalsSwap = await captureGlobalsSwap()
		} else {
			applyGlobals(globalsSwap.keys, globalsSwap.runtime)
		}
	})
	afterAll(() => {
		if (globalsSwap !== undefined) {
			applyGlobals(globalsSwap.keys, globalsSwap.happyDom)
		}
	})
}

/**
 * Sends each request whose URL `route` maps to the mapped URL instead, for every test of the enclosing block: a
 * provider with a fixed IdP host (Apple, Facebook, Microsoft) reaches the fake IdP through the global `fetch`.
 */
export const useFetchRoutes = (route: (url: URL) => string | undefined): void => {
	let unrouted: typeof fetch
	beforeEach(() => {
		unrouted = globalThis.fetch
		const routed = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
			const url = new URL(input instanceof Request ? input.url : input)
			return await unrouted(route(url) ?? input, init)
		}
		globalThis.fetch = Object.assign(routed, { preconnect: unrouted.preconnect })
	})
	afterEach(() => {
		globalThis.fetch = unrouted
	})
}

export const REDIRECT_URL = 'https://app.example.com/callback'

export const signer: DataSigner = (purpose, value) => createHmac('sha256', `test-key:${purpose}`).update(value).digest()

/** A provider configuration pointing at the fake IdP with its registered client. */
export const configurationFor = (idp: FakeIdp, overrides: Partial<OIDCConfiguration> = {}): OIDCConfiguration => ({
	url: idp.baseUrl,
	clientId: idp.client.clientId,
	clientSecret: idp.client.clientSecret,
	...overrides,
})

export interface SignInRun {
	readonly init: InitIDPAuthResult
	readonly authorization: FakeIdpAuthorization
	readonly response: IDPResponse
}

/** `initAuth` → the browser at the authorization endpoint → `processResponse`, as the tenant API's two mutations do. */
export const signIn = async (
	provider: OIDCProvider,
	configuration: OIDCConfiguration,
	idp: FakeIdp,
	{ responseMode, passAs = 'parameters' }: { readonly responseMode?: string; readonly passAs?: 'parameters' | 'url' } = {},
): Promise<SignInRun> => {
	const init = await startSignIn(provider, configuration, responseMode)
	const authorization = await idp.authorize(init.authUrl)
	const response = await provider.processResponse(configuration, {
		...(passAs === 'url' ? { url: authorization.redirectTo } : { parameters: authorization.parameters }),
		redirectUrl: REDIRECT_URL,
		sessionData: init.sessionData,
	})
	return { init, authorization, response }
}

export const startSignIn = async (provider: OIDCProvider, configuration: OIDCConfiguration, responseMode?: string): Promise<InitIDPAuthResult> =>
	await provider.initAuth(configuration, { redirectUrl: REDIRECT_URL, ...(responseMode ? { responseMode } : {}) })

/** Query parameters of an authorization URL. */
export const authUrlParameters = (authUrl: string): Record<string, string> => Object.fromEntries(new URL(authUrl).searchParams)

/** The nonce and state `initAuth` handed to the client, read out of its opaque `sessionData`. */
export const sessionDataOf = (init: InitIDPAuthResult): { nonce: string; state: string } => {
	const data: unknown = init.sessionData
	if (typeof data !== 'object' || data === null || !('nonce' in data) || !('state' in data)) {
		throw new Error('expected session data with a nonce and a state')
	}
	const { nonce, state } = data
	if (typeof nonce !== 'string' || typeof state !== 'string') {
		throw new Error('expected a string nonce and state')
	}
	return { nonce, state }
}
