import { join } from 'path'
import { ConfigProcessor, Plugin } from '@contember/engine-plugins'
import { ConfigSource, readConfig, ServerConfig } from '../config/config'
import { Type } from '@contember/typesafe'
import {
	createLogger,
	JsonStreamTransport,
	Logger, LoggerTransport, LogLevels,
	PrettyPrintTransport,
	TransportList,
} from '@contember/engine-common'

export const getServerVersion = (): string => {
	const packageJsonFile = process.env.CONTEMBER_PACKAGE_JSON || join(__dirname, '../../../package.json')
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const version = require(packageJsonFile).version
	return version
}

export const isDebugMode = (): boolean => process.env.NODE_ENV === 'development'

export const printStartInfo = ({ version, isDebug }: { version: string; isDebug: boolean }, logger: Logger) => {
	logger.info(`Starting Contember ${version}`)
	logger.info(`NODE_ENV is set to ${process.env.NODE_ENV}`)
	if (isDebug) {
		logger.warn('Starting Contember in debug mode')
		logger.warn('NEVER USE debug mode in production environment')
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

export const createDefaultLogger = (): Logger & { addTransport: (transport: LoggerTransport) => void } => {
	const isDebug = isDebugMode()
	const logger = createLogger({
		pid: process.pid,
		loggerId: Math.random().toString().substring(2),
	}, {
		logLevel: LogLevels[(process.env.CONTEMBER_LOGGER_LEVEL as keyof typeof LogLevels) ?? 'info'],
	})
	const loggerType = process.env.CONTEMBER_LOGGER_FORMAT ?? (isDebug ? 'pretty' : 'json')
	const stream = process.stderr
	logger.addTransport(loggerType === 'pretty' ? new PrettyPrintTransport(stream) : new JsonStreamTransport(stream))
	return logger
}
