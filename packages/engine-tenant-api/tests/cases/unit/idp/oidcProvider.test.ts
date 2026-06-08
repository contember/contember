import { describe, expect, test } from 'bun:test'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { InvalidIDPConfigurationError } from '../../../../src/model/service/idp/InvalidIDPConfigurationError.js'

const baseConfig = {
	url: 'https://idp.example.com',
	clientId: 'client',
	clientSecret: 'secret',
}

describe('OIDCProvider.validateConfiguration', () => {
	const provider = new OIDCProvider()

	test('accepts tokenEndpointAuthMethod', () => {
		const config = provider.validateConfiguration({ ...baseConfig, tokenEndpointAuthMethod: 'client_secret_post' })
		expect(config.tokenEndpointAuthMethod).toBe('client_secret_post')
	})

	test('rejects an unknown tokenEndpointAuthMethod', () => {
		expect(() => provider.validateConfiguration({ ...baseConfig, tokenEndpointAuthMethod: 'magic' }))
			.toThrow(InvalidIDPConfigurationError)
	})
})
