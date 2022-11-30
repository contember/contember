import * as Typesafe from '@contember/typesafe'
import { Client, custom, Issuer } from 'openid-client'
import { IdentityProviderHandler, IDPClaim, InitIDPAuthResult } from '../IdentityProviderHandler'
import { IDPValidationError } from '../IDPValidationError'
import { InvalidIDPConfigurationError } from '../InvalidIDPConfigurationError'
import { catchTypesafe } from './helpers'
import { BaseOIDCConfiguration, OIDCResponseData, OIDCSessionData } from './OIDCTypes'
import { handleOIDCResponse, initOIDCAuth } from './OIDCHelpers'
import { createHmac } from 'node:crypto'
import { IDPResponseError } from '../IDPResponseError'

custom.setHttpOptionsDefaults({
	timeout: 5000,
})

const FacebookConfiguration = BaseOIDCConfiguration
type FacebookConfiguration = ReturnType<typeof FacebookConfiguration>

const FacebookResponseData = Typesafe.union(
	OIDCResponseData,
	Typesafe.object({
		authResponse: Typesafe.object({
			accessToken: Typesafe.string,
			signedRequest: Typesafe.string,
		}),
	}),
)
const FacebookResponsePayload = Typesafe.object({
	user_id: Typesafe.string,
	code: Typesafe.string,
})

type FacebookResponseData = ReturnType<typeof FacebookResponseData>


export class FacebookProvider implements IdentityProviderHandler<OIDCSessionData, FacebookResponseData, FacebookConfiguration> {
	// based on https://www.facebook.com/.well-known/openid-configuration/
	// facebook .well-known endpoint does have "token_endpoint" field
	private facebookIssuer = new Issuer({
		issuer: 'https://www.facebook.com',
		authorization_endpoint: 'https://facebook.com/dialog/oauth/',
		jwks_uri: 'https://www.facebook.com/.well-known/oauth/openid/jwks/',
		response_types_supported: [
			'id_token',
			'token id_token',
		],
		subject_types_supported: [
			'pairwise',
		],
		id_token_signing_alg_values_supported: [
			'RS256',
		],
		claims_supported: [
			'iss',
			'aud',
			'sub',
			'iat',
			'exp',
			'jti',
			'nonce',
			'at_hash',
			'name',
			'given_name',
			'middle_name',
			'family_name',
			'email',
			'picture',
			'user_friends',
			'user_birthday',
			'user_age_range',
			'user_link',
			'user_hometown',
			'user_location',
			'user_gender',
		],
		token_endpoint: 'https://graph.facebook.com/v11.0/oauth/access_token',
	})

	validateResponseData = catchTypesafe(FacebookResponseData, IDPValidationError)
	validateConfiguration = catchTypesafe(FacebookConfiguration, InvalidIDPConfigurationError)

	public async initAuth(configuration: FacebookConfiguration, redirectUrl: string): Promise<InitIDPAuthResult<OIDCSessionData>> {
		const client = await this.createOIDCClient(configuration)
		return await initOIDCAuth(client, redirectUrl, configuration)
	}

	public async processResponse(configuration: FacebookConfiguration, responseData: FacebookResponseData): Promise<IDPClaim> {
		if ('url' in responseData) {
			const client = await this.createOIDCClient(configuration)
			return await handleOIDCResponse(client, responseData)
		} else {
			const [sig, payload] = responseData.authResponse.signedRequest.split('.')
			const data = catchTypesafe(FacebookResponsePayload, IDPValidationError)(JSON.parse(Buffer.from(payload, 'base64').toString('utf8')))
			const hmac = createHmac('sha256', configuration.clientSecret)
			const signature = hmac.update(payload).digest()
			const isSignatureValid = signature.compare(Buffer.from(sig, 'base64')) === 0
			if (!isSignatureValid) {
				throw new IDPValidationError('Invalid signature')
			}
			const url = `https://graph.facebook.com/${data.user_id}?fields=id,email,name&access_token=${responseData.authResponse.accessToken}`
			const response = await fetch(url)
			if (!response.ok) {
				throw new IDPResponseError(`Invalid Facebook response: [${response.status}] ${await response.text()}`)
			}
			const apiData = await response.json()

			return {
				externalIdentifier: data.user_id,
				name: apiData.name,
				email: apiData.email,
			}
		}
	}

	private async createOIDCClient(configuration: FacebookConfiguration): Promise<Client> {
		return new this.facebookIssuer.Client({
			client_id: configuration.clientId,
			client_secret: configuration.clientSecret,
			response_types: [configuration.responseType || 'code'],
		})
	}
}
