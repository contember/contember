import { createHmac } from 'node:crypto'
import { DataSigner } from '../../../../src/index.js'
import { IDPResponse, InitIDPAuthResult } from '../../../../src/model/service/idp/IdentityProviderHandler.js'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { OIDCConfiguration } from '../../../../src/model/service/idp/providers/OIDCTypes.js'
import { FakeIdp, FakeIdpAuthorization } from './FakeIdp.js'

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
