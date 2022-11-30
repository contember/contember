import { IdentityProviderHandler, IDPClaim, InitIDPAuthResult } from '../../src'

export class IdPMock implements IdentityProviderHandler<any, any, any> {
	initAuth(configuration: any, redirectUrl: string): Promise<InitIDPAuthResult<any>> {
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

	validateResponseData(data: unknown): any {
		return data
	}
}
