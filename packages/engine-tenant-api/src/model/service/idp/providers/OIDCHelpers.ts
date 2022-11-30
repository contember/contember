import { Client, errors, generators } from 'openid-client'
import { OIDCResponseData, OIDCSessionData } from './OIDCTypes'
import { IDPValidationError } from '../IDPValidationError'
import { IDPResponseError } from '../IDPResponseError'
import { IDPClaim, InitIDPAuthResult } from '../IdentityProviderHandler'


export const initOIDCAuth = async (client: Client, { redirectUrl, claims, responseMode }: { redirectUrl: string; claims?: string; responseMode?: string }): Promise<InitIDPAuthResult> => {
	const nonce = generators.nonce()
	const state = generators.state()
	const url = client.authorizationUrl({
		redirect_uri: redirectUrl,
		response_mode: responseMode,
		scope: claims ?? 'openid email',
		nonce,
		state,
	})

	return {
		authUrl: url,
		sessionData: { nonce, state },
	}
}

export const handleOIDCResponse = async (client: Client, { url, sessionData, redirectUrl }: OIDCResponseData): Promise<IDPClaim> => {
	const params = client.callbackParams(url)
	try {
		const result = await client.callback(redirectUrl, params, sessionData)
		const claims = result.claims()
		return {
			externalIdentifier: claims.sub,
			email: claims.email,
			name: claims.name,
		}
	} catch (e: any) {
		if (e instanceof errors.RPError) {
			throw new IDPValidationError(e.message)
		}
		if (e instanceof errors.OPError) {
			const body = e.response?.body as any
			if (typeof body === 'object' && typeof body?.error === 'object' && typeof body.error?.message === 'string') {
				throw new IDPResponseError(body.error.message)
			}
			throw new IDPResponseError(e.message)
		}
		throw e
	}
}
