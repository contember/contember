import { Client, custom, errors, generators } from 'openid-client'
import { OIDCResponseData } from './OIDCTypes'
import { IDPValidationError } from '../IDPValidationError'
import { IDPResponseError } from '../IDPResponseError'
import { IDPResponse, InitIDPAuthResult } from '../IdentityProviderHandler'

custom.setHttpOptionsDefaults({
	timeout: 5000,
})

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

export const handleOIDCResponse = async (client: Client, { sessionData, redirectUrl, ...otherData }: OIDCResponseData, fetchUserInfo?: boolean): Promise<IDPResponse> => {
	const params = 'parameters' in otherData ? otherData.parameters : client.callbackParams(otherData.url)
	if (params.state && !sessionData?.state) {
		throw new IDPValidationError(`state is present in parameters, but missing in session data`)
	}
	try {
		const result = await client.callback(redirectUrl, params, sessionData)
		const claims = result.claims()
		const { at_hash, c_hash, nonce, ...claimsWithoutHashes } = claims
		const userInfo = fetchUserInfo ? await client.userinfo(result) : {}

		return {
			externalIdentifier: claims.sub,
			...claimsWithoutHashes,
			...userInfo,
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
