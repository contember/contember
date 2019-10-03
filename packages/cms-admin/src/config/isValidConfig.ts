import { Config } from './Config'
import { ConfigurationError } from './ConfigurationError'

export function isValidConfig(config: any): config is Config {
	if (config.apiServer === undefined) {
		throw new ConfigurationError(`Undefined property apiServer in configuration`)
	}
	if (config.loginToken === undefined) {
		throw new ConfigurationError(`Undefined property loginToken in configuration`)
	}
	return typeof config.apiServer === 'string' && typeof config.loginToken === 'string'
}
