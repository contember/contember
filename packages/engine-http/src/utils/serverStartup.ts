import { join } from 'path'
import { ConfigSource, readConfig, ServerConfig } from '../config/config'
import { Type } from '@contember/typesafe'
import { createLogger, JsonStreamLoggerHandler, Logger, LogLevels, PrettyPrintLoggerHandler } from '@contember/logger'
import { ConfigProcessor } from '../config/ConfigProcessor'
import { Plugin } from '../plugin/Plugin'

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
		.filter((it): it is ConfigProcessor<any> => it !== null)

	const configSources: ConfigSource[] = []
	for (const configType of ['file', 'yaml', 'json'] as const) {
		const envValue = process.env['CONTEMBER_CONFIG_' + configType.toUpperCase()]
		if (envValue) {
			configSources.push({ type: configType, data: envValue })
		}
	}

	return await readConfig(configSources, configProcessors, serverConfigSchema)
}

export const createDefaultLogger = (): Logger => {
	const isDebug = isDebugMode()
	const loggerType = process.env.CONTEMBER_LOGGER_FORMAT ?? (isDebug ? 'pretty' : 'json')
	const stream = process.stderr
	const handler = loggerType === 'pretty'
		? new PrettyPrintLoggerHandler(stream, {
			formatters: {
				pid: () => undefined,
				loggerId: () => undefined,
				uri: ({ attributes, chalk }) => {
					const color = attributes.status === undefined
						? chalk.cyan
						: attributes.status < 300
							? chalk.green
							: chalk.yellowBright
					const timeInfo = attributes.totalTimeMs !== undefined ? ` ${attributes.totalTimeMs}ms` : ''
					const statusInfo = attributes.status !== undefined ? ` [${attributes.status}]` : ''
					return { line: color(`${attributes.method}${statusInfo} ${attributes.uri}${timeInfo} ${chalk.white.dim('#' + attributes.requestId)}`) }
				},
				method: () => undefined,
				requestId: () => undefined,
				timeLabel: () => undefined,
				status: () => undefined,
				totalTimeMs: () => undefined,
				events: ({ formattedValue }) => formattedValue === '[]' ? undefined : formattedValue,
			},
		})
		: new JsonStreamLoggerHandler(stream)
	const logLevel = (process.env.CONTEMBER_LOGGER_LEVEL as keyof typeof LogLevels) ?? 'info'
	return createLogger(handler, {
		pid: process.pid,
		loggerId: Math.random().toString().substring(2),
	}, {
		fingerCrossedOptions: {
			logAlwaysLevel: LogLevels[logLevel],
		},
	})
}
