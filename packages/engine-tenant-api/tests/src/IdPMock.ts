import { IdentityProviderHandler, IDPResponse, InitIDPAuthResult } from '../../src/index.js'

export class IdPMock implements IdentityProviderHandler<any> {
	initAuth(configuration: any, data: unknown): Promise<InitIDPAuthResult> {
		return Promise.resolve({
			authUrl: 'http://localhost',
			sessionData: { foo: 'bar' },
		})
	}

	processResponse(configuration: any, responseData: any): Promise<IDPResponse> {
		return Promise.resolve({
			externalIdentifier: configuration.externalIdentifier,
			email: configuration.email,
			emailVerified: configuration.emailVerified,
		})
	}

	validateConfiguration(config: unknown): any {
		return config
	}
}
