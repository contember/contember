import { ApiClientError } from '../ApiClientError'
import { ClientConfig } from './ClientConfig'

export function assertValidClientConfig(config: any): asserts config is ClientConfig {
	if (typeof config !== 'object' || config === null) {
		throw new ApiClientError(`The client configuration must be an object.`)
	}
	if (!('apiBaseUrl' in config && typeof config.apiBaseUrl === 'string')) {
		throw new ApiClientError(
			`The 'apiBaseUrl' property of the config object must be a string but '${typeof config.apiBaseUrl} was supplied.`,
		)
	}
	if (!('loginToken' in config && typeof config.loginToken === 'string')) {
		throw new ApiClientError(
			`The 'loginToken' property of the config object must be a string but ${typeof config.loginToken} was supplied.`,
		)
	}
}
