export default interface Config {
	apiServer: string
	loginToken: string
}

export function validateConfig(config: any) {
	if (typeof config.apiServer === 'undefined') {
		throw new ConfigurationError(`Undefined property apiServer in configuration`)
	}
	if (typeof config.loginToken === 'undefined') {
		throw new ConfigurationError(`Undefined property loginToken in configuration`)
	}
}

export class ConfigurationError extends Error {}
