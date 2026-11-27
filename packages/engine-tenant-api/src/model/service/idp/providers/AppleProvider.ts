import * as Typesafe from '@contember/typesafe'
import { IdentityProviderHandler, IDPResponse, InitIDPAuthResult } from '../IdentityProviderHandler.js'
import { OIDCConfiguration, OIDCConfigurationOptions, OIDCInitData, OIDCResponseData, OIDCSessionData } from './OIDCTypes.js'
import { catchTypesafe } from './helpers.js'
import { IDPValidationError } from '../IDPValidationError.js'
import { InvalidIDPConfigurationError } from '../InvalidIDPConfigurationError.js'
import {
	COMMON_SETUP,
	defaultClientAuth,
	flowOfResponseType,
	flowSetup,
	handleOIDCResponse,
	initOIDCAuth,
	JwksCarrier,
	OIDCFlow,
} from './OIDCHelpers.js'
import { Configuration, discovery, ServerMetadata } from 'openid-client'
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
	private metadata: ServerMetadata | undefined
	private readonly jwks = new JwksCarrier()

	validateConfiguration = catchTypesafe(AppleConfiguration, InvalidIDPConfigurationError)

	public async initAuth(configuration: AppleConfiguration, data: unknown): Promise<InitIDPAuthResult> {
		const initData = catchTypesafe(OIDCInitData, IDPValidationError)(data)
		const responseType = configuration.responseType || 'code'
		const client = this.createOIDCClient(
			configuration,
			await this.discover(configuration),
			await this.createClientSecret(configuration),
			flowOfResponseType(responseType),
		)
		return initOIDCAuth(client, {
			scope: configuration.scope ?? configuration.claims,
			responseType,
			...initData,
		})
	}

	public async processResponse(configuration: AppleConfiguration, data: unknown): Promise<IDPResponse> {
		const responseData = catchTypesafe(OIDCResponseData, IDPValidationError)(data)
		const metadata = await this.discover(configuration)
		const clientSecret = await this.createClientSecret(configuration)
		return await this.jwks.run(
			flow => this.createOIDCClient(configuration, metadata, clientSecret, flow),
			clientFor => handleOIDCResponse(clientFor, responseData, { additionalAuthorizedParties: configuration.additionalAuthorizedParties }),
		)
	}

	getPublicConfiguration({ privateKey, ...config }: AppleConfiguration): Partial<AppleConfiguration> {
		return config
	}

	private async discover(configuration: AppleConfiguration): Promise<ServerMetadata> {
		this.metadata ??= (await discovery(new URL(APPLE_OIDC_CONFIGURATION_ENDPOINT), configuration.clientId)).serverMetadata()
		return this.metadata
	}

	/** Apple's client secret is a short-lived ES256 JWT signed with the configured key, made anew for every call. */
	private async createClientSecret(configuration: AppleConfiguration): Promise<string> {
		const privateKey = await importPKCS8(configuration.privateKey, 'ES256')

		return await new SignJWT({})
			.setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid: configuration.keyId })
			.setIssuedAt()
			.setIssuer(configuration.teamId)
			.setAudience('https://appleid.apple.com')
			.setSubject(configuration.clientId)
			.setExpirationTime('10m')
			.sign(privateKey)
	}

	private createOIDCClient(configuration: AppleConfiguration, metadata: ServerMetadata, clientSecret: string, flow: OIDCFlow): Configuration {
		// Apple advertises client_secret_post only, which the default picks, as openid-client 5 did
		const client = new Configuration(
			metadata,
			configuration.clientId,
			{ client_secret: clientSecret, id_token_signed_response_alg: 'RS256' },
			defaultClientAuth(clientSecret),
		)
		for (const setup of [...COMMON_SETUP, ...flowSetup(flow)]) {
			setup(client)
		}
		return client
	}
}
