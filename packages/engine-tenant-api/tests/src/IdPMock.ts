import { IdentityProviderHandler, IDPClaim, InitIDPAuthResult } from '../../src'

export class IdPMock implements IdentityProviderHandler<any> {
	initAuth(configuration: any, data: unknown): Promise<InitIDPAuthResult> {
		return Promise.resolve({
			authUrl: 'http://localhost',
			sessionData: { foo: 'bar' },
		})
	}

	processResponse(configuration: any, responseData: any): Promise<IDPClaim> {
		return Promise.resolve({
			externalIdentifier: configuration.externalIdentifier,
			email: configuration.email,
		})
	}

	validateConfiguration(config: unknown): any {
		return config
	}
}
