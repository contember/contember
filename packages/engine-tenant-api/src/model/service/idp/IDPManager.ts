import { IdentityProvider, IDPClaim, IDPResponse, InitIDPAuthResult } from './IdentityProvider'
import { IdentityProviderNotFoundError } from './IdentityProviderNotFoundError'

export class IDPManager {
	private providers: Record<string, IdentityProvider<any, any>> = {}

	public registerProvider(type: string, provider: IdentityProvider<any, any>): void {
		this.providers[type] = provider
	}

	public async initAuth(type: string, configuration: unknown, redirectUrl: string): Promise<InitIDPAuthResult<any>> {
		const provider = this.providers[type]
		if (!type) {
			throw new IdentityProviderNotFoundError(`Identity provider ${type} not found`)
		}
		const validatedConfig = provider.validateConfiguration(configuration)
		return await provider.initAuth(validatedConfig, redirectUrl)
	}

	async processResponse<Configuration extends {}, SessionData extends {}>(
		type: string,
		configuration: Configuration,
		redirectUrl: string,
		idpResponse: IDPResponse,
		sessionData: SessionData,
	): Promise<IDPClaim> {
		const provider = this.providers[type]
		if (!type) {
			throw new IdentityProviderNotFoundError(`Identity provider ${type} not found`)
		}
		const validatedConfig = provider.validateConfiguration(configuration)

		return await provider.processResponse(validatedConfig, redirectUrl, idpResponse, sessionData)
	}
}
