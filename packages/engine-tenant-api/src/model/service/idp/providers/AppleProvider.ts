import * as Typesafe from '@contember/typesafe'
import { IdentityProviderHandler, IDPResponse, InitIDPAuthResult } from '../IdentityProviderHandler'
import { OIDCConfiguration, OIDCConfigurationOptions, OIDCInitData, OIDCResponseData, OIDCSessionData } from './OIDCTypes'
import { catchTypesafe } from './helpers'
import { IDPValidationError } from '../IDPValidationError'
import { InvalidIDPConfigurationError } from '../InvalidIDPConfigurationError'
import { handleOIDCResponse, initOIDCAuth } from './OIDCHelpers'
import { Client, Issuer } from 'openid-client'
import { importPKCS8, SignJWT } from 'jose'

export const AppleConfiguration = Typesafe.intersection(
	Typesafe.object({
		keyId: Typesafe.string,
		teamId: Typesafe.string,
		clientId: Typesafe.string,
		privateKey: Typesafe.string,
	}),
	OIDCConfigurationOptions,
)

type AppleConfiguration = ReturnType<typeof AppleConfiguration>

const APPLE_OIDC_CONFIGURATION_ENDPOINT = 'https://appleid.apple.com/.well-known/openid-configuration'

export class AppleProvider implements IdentityProviderHandler<AppleConfiguration> {
	private issuer: Issuer<Client> | undefined

	validateConfiguration = catchTypesafe(AppleConfiguration, InvalidIDPConfigurationError)

	public async initAuth(configuration: AppleConfiguration, data: unknown): Promise<InitIDPAuthResult> {
		const initData = catchTypesafe(OIDCInitData, IDPValidationError)(data)
		const client = await this.createOIDCClient(configuration)
		return await initOIDCAuth(client, {
			scope: configuration.scope ?? configuration.claims,
			...initData,
		})
	}

	public async processResponse(configuration: AppleConfiguration, data: unknown): Promise<IDPResponse> {
		const responseData = catchTypesafe(OIDCResponseData, IDPValidationError)(data)
		const client = await this.createOIDCClient(configuration)
		return await handleOIDCResponse(client, responseData)
	}

	getPublicConfiguration({ privateKey, ...config }: AppleConfiguration): Partial<AppleConfiguration> {
		return config
	}

	private async createOIDCClient(configuration: AppleConfiguration): Promise<Client> {
		this.issuer ??= await Issuer.discover(APPLE_OIDC_CONFIGURATION_ENDPOINT)
		const privateKey = await importPKCS8(configuration.privateKey, 'ES256')

		const jwt = await new SignJWT({})
			.setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid: configuration.keyId })
			.setIssuedAt()
			.setIssuer(configuration.teamId)
			.setAudience('https://appleid.apple.com')
			.setSubject(configuration.clientId)
			.setExpirationTime('10m')
			.sign(privateKey)

		return new this.issuer.Client(
			{
				client_id: configuration.clientId,
				client_secret: jwt,
				response_types: [configuration.responseType || 'code'],
			},
			undefined,
			{
				additionalAuthorizedParties: [...(configuration.additionalAuthorizedParties ?? [])],
			},
		)
	}
}
