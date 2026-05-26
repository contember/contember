import { Client, custom, errors, generators } from 'openid-client'
import { OIDCResponseData } from './OIDCTypes.js'
import { IDPValidationError } from '../IDPValidationError.js'
import { IDPResponseError } from '../IDPResponseError.js'
import { IDPResponse, InitIDPAuthResult } from '../IdentityProviderHandler.js'

export const initOIDCAuth = async (
	client: Client,
	{ redirectUrl, scope, responseMode }: { redirectUrl: string; scope?: string; responseMode?: string },
): Promise<InitIDPAuthResult> => {
	const nonce = generators.nonce()
	const state = generators.state()
	const url = client.authorizationUrl({
		redirect_uri: redirectUrl,
		response_mode: responseMode,
		scope: scope ?? 'openid email',
		nonce,
		state,
	})

	return {
		authUrl: url,
		sessionData: { nonce, state },
	}
}

export const handleOIDCResponse = async (
	client: Client,
	{ sessionData, redirectUrl, ...otherData }: OIDCResponseData,
	fetchUserInfo?: boolean,
	returnOIDCResult?: boolean,
): Promise<IDPResponse> => {
	const params = 'parameters' in otherData ? otherData.parameters : client.callbackParams(otherData.url)
	if (params.state && !sessionData?.state) {
		throw new IDPValidationError(`state is present in parameters, but missing in session data`)
	}
	try {
		const result = await client.callback(redirectUrl, params, sessionData)
		const claims = result.claims()
		const { at_hash, c_hash, nonce, ...claimsWithoutHashes } = claims
		const userInfo = result.access_token && fetchUserInfo ? await client.userinfo(result) : {}
		const oidcResult = returnOIDCResult ? result : {}

		// The OIDC `email_verified` claim is a boolean per spec, but some providers
		// send the string "true"; userInfo takes precedence over the ID token.
		const rawEmailVerified = (userInfo as Record<string, unknown>).email_verified ?? claimsWithoutHashes.email_verified
		const emailVerified = rawEmailVerified === true || rawEmailVerified === 'true'

		return {
			externalIdentifier: claims.sub,
			...oidcResult,
			...claimsWithoutHashes,
			...userInfo,
			emailVerified,
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
