import { ClientError } from '@contember/react-client'
import type { ClientConfig } from './ClientConfig'

export function assertValidClientConfig(config: any): asserts config is ClientConfig {
	if (typeof config !== 'object' || config === null) {
		throw new ClientError(`The client configuration must be an object.`)
	}

	if (!('apiBaseUrl' in config && typeof config.apiBaseUrl === 'string')) {
		throw new ClientError(
			`The 'apiBaseUrl' property of the config object must be a string but '${typeof config.apiBaseUrl} was supplied.`,
		)
	}

	if (!('sessionToken' in config && typeof config.sessionToken === 'string')) {
		throw new ClientError(
			`The 'sessionToken' property of the config object must be a string but ${typeof config.sessionToken} was supplied.`,
		)
	}
}
