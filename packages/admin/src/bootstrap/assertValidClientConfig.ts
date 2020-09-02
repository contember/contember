import { ClientError } from '@contember/react-client'
import { ClientConfig } from './ClientConfig'

export function assertValidClientConfig(config: any): asserts config is ClientConfig {
	if (typeof config !== 'object' || config === null) {
		throw new ClientError(`The client configuration must be an object.`)
	}
	if (!('apiBaseUrl' in config && typeof config.apiBaseUrl === 'string')) {
		throw new ClientError(
			`The 'apiBaseUrl' property of the config object must be a string but '${typeof config.apiBaseUrl} was supplied.`,
		)
	}
	if (!('loginToken' in config && typeof config.loginToken === 'string')) {
		throw new ClientError(
			`The 'loginToken' property of the config object must be a string but ${typeof config.loginToken} was supplied.`,
		)
	}
}
