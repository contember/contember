import { describe, expect, test } from 'bun:test'
import { OIDCProvider } from '../../../../src/model/service/idp/providers/OIDCProvider.js'
import { InvalidIDPConfigurationError } from '../../../../src/model/service/idp/InvalidIDPConfigurationError.js'

const baseConfig = {
	url: 'https://idp.example.com',
	clientId: 'client',
	clientSecret: 'secret',
}

describe('OIDCProvider.validateConfiguration', () => {
	const provider = new OIDCProvider(null, null)

	test('accepts tokenEndpointAuthMethod', () => {
		const config = provider.validateConfiguration({ ...baseConfig, tokenEndpointAuthMethod: 'client_secret_post' })
		expect(config.tokenEndpointAuthMethod).toBe('client_secret_post')
	})

	test('rejects an unknown tokenEndpointAuthMethod', () => {
		expect(() => provider.validateConfiguration({ ...baseConfig, tokenEndpointAuthMethod: 'magic' }))
			.toThrow(InvalidIDPConfigurationError)
	})

	test('accepts a claimMapping with attributesKey and dot-path subject', () => {
		const config = provider.validateConfiguration({
			...baseConfig,
			claimMapping: { externalIdentifier: 'oid', email: 'email', attributesKey: 'attributes' },
		})
		expect(config.claimMapping).toEqual({ externalIdentifier: 'oid', email: 'email', attributesKey: 'attributes' })
	})
})

describe('OIDCProvider.validateWrittenConfiguration', () => {
	const provider = new OIDCProvider(null, null)

	test.each(['none', 'HS256', 'hs512'])('refuses idTokenSignedResponseAlg %s', alg => {
		expect(() => provider.validateWrittenConfiguration({ ...baseConfig, idTokenSignedResponseAlg: alg })).toThrow(InvalidIDPConfigurationError)
	})

	test.each(['RS256', 'ES256', 'PS384'])('accepts idTokenSignedResponseAlg %s', alg => {
		expect(() => provider.validateWrittenConfiguration({ ...baseConfig, idTokenSignedResponseAlg: alg })).not.toThrow()
	})
})
