import { join } from 'path'
import { ConfigProcessor, Plugin } from '@contember/engine-plugins'
import { ConfigSource, readConfig, ServerConfig } from '../config/config'
import { Type } from '@contember/typesafe'

export const getServerVersion = (): string => {
	const packageJsonFile = process.env.CONTEMBER_PACKAGE_JSON || join(__dirname, '../../../package.json')
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const version = require(packageJsonFile).version
	return version
}

export const isDebugMode = (): boolean => process.env.NODE_ENV === 'development'

export const printStartInfo = ({ version, isDebug }: { version: string; isDebug: boolean }) => {
	// eslint-disable-next-line no-console
	console.log(`Starting Contember ${version}`)
	// eslint-disable-next-line no-console
	console.log(`NODE_ENV is set to ${process.env.NODE_ENV}`)
	if (isDebug) {
		// eslint-disable-next-line no-console
		console.log('Starting Contember in debug mode')
		// eslint-disable-next-line no-console
		console.log('NEVER USE debug mode in production environment')
	}
}

export const resolveServerConfig = async <T extends ServerConfig>({ plugins, serverConfigSchema }: { plugins: Plugin[]; serverConfigSchema: Type<T> }) => {
	const configProcessors = plugins
		.map(it => (it.getConfigProcessor ? it.getConfigProcessor() : null))
		.filter((it): it is ConfigProcessor => it !== null)

	const configSources: ConfigSource[] = []
	for (const configType of ['file', 'yaml', 'json'] as const) {
		const envValue = process.env['CONTEMBER_CONFIG_' + configType.toUpperCase()]
		if (envValue) {
			configSources.push({ type: configType, data: envValue })
		}
	}

	return await readConfig(configSources, configProcessors, serverConfigSchema)
}
