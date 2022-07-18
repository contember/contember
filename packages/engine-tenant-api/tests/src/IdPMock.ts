import { IdentityProviderHandler, IDPClaim, IDPResponse, InitIDPAuthResult } from '../../src'

export class IdPMock implements IdentityProviderHandler<any, any> {
	initAuth(configuration: any, redirectUrl: string): Promise<InitIDPAuthResult<any>> {
		return Promise.resolve({
			authUrl: 'http://localhost',
			sessionData: { foo: 'bar' },
		})
	}

	processResponse(configuration: any, redirectUrl: string, idpResponse: IDPResponse, sessionData: any): Promise<IDPClaim> {
		return Promise.resolve({
			externalIdentifier: configuration.externalIdentifier,
			email: configuration.email,
		})
	}

	validateConfiguration(config: unknown): any {
		return config
	}
}
