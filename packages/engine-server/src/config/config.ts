import {
	ConfigLoader,
	createObjectParametersResolver,
	Merger,
	resolveParameters,
	UndefinedParameterError,
} from '@contember/config-loader'
import { DatabaseCredentials } from '@contember/database'
import { tuple, upperCaseFirst } from '../utils'
import { MailerOptions, TenantCredentials } from '@contember/engine-tenant-api'
import { ConfigProcessor } from '@contember/engine-plugins'
import {
	isObject,
	typeConfigError,
	hasStringProperty,
	hasNumberProperty,
	hasBooleanProperty,
} from '@contember/engine-common'
import { ProjectConfig, ProjectConfigResolver, StageConfig } from '@contember/engine-http'

export interface TenantConfig {
	db: DatabaseCredentials
	mailer: MailerOptions
	credentials: TenantCredentials
	secrets?: {
		encryptionKey: string
	}
}

export interface Config {
	tenant: TenantConfig
	server: {
		port: number
		monitoringPort: number
		workerCount?: number | string
		http: {
			requestBodySize?: string
		}
		logging: {
			sentry?: {
				dsn: string
			}
		}
	}
}

function checkDatabaseCredentials(json: unknown, path: string): DatabaseCredentials {
	if (!isObject(json)) {
		return typeConfigError(path, json, 'object')
	}
	if (!hasStringProperty(json, 'host')) {
		return typeConfigError(path + '.host', json.host, 'string')
	}
	if (!hasNumberProperty(json, 'port')) {
		return typeConfigError(path + '.port', json.port, 'number')
	}
	if (!hasStringProperty(json, 'user')) {
		return typeConfigError(path + '.user', json.user, 'string')
	}
	if (!hasStringProperty(json, 'password')) {
		return typeConfigError(path + '.password', json.password, 'string')
	}
	if (!hasStringProperty(json, 'database')) {
		return typeConfigError(path + '.database', json.database, 'string')
	}
	if (json.ssl !== undefined && !hasBooleanProperty(json, 'ssl')) {
		return typeConfigError(path + '.ssl', json.ssl, 'boolean')
	}
	return json
}

function checkMailerParameters(json: unknown, path: string): MailerOptions {
	if (!isObject(json)) {
		return typeConfigError(path, json, 'object')
	}
	const values = Object.fromEntries(Object.entries(json).filter(([, it]) => it !== undefined))
	if ('from' in values && !hasStringProperty(values, 'from')) {
		return typeConfigError(path + '.from', values.from, 'string')
	}
	if ('host' in values && !hasStringProperty(values, 'host')) {
		return typeConfigError(path + '.host', values.host, 'string')
	}
	if ('port' in values && !hasNumberProperty(values, 'port')) {
		return typeConfigError(path + '.port', values.port, 'number')
	}
	if ('user' in values && !hasStringProperty(json, 'user')) {
		return typeConfigError(path + '.user', json.user, 'string')
	}
	if ('password' in values && !hasStringProperty(json, 'password')) {
		return typeConfigError(path + '.password', json.password, 'string')
	}
	return {
		...values,
		...('user' in values && 'password' in values
			? { auth: { user: String(values.user), pass: String(values.password) } }
			: {}),
	}
}

function checkTenantCredentials(json: unknown, path: string): TenantCredentials {
	if (!isObject(json)) {
		return typeConfigError(path, json, 'object')
	}
	const values = Object.fromEntries(Object.entries(json).filter(([, it]) => it !== undefined))
	if ('rootToken' in values && !hasStringProperty(values, 'rootToken')) {
		return typeConfigError(path + '.rootToken', values.rootToken, 'string')
	}
	if ('rootPassword' in values && !hasStringProperty(values, 'rootPassword')) {
		return typeConfigError(path + '.rootPassword', values.rootPassword, 'string')
	}
	if ('rootEmail' in values && !hasStringProperty(values, 'rootEmail')) {
		return typeConfigError(path + '.rootEmail', values.rootEmail, 'string')
	}
	if ('loginToken' in values && !hasStringProperty(values, 'loginToken')) {
		return typeConfigError(path + '.loginToken', values.loginToken, 'string')
	}

	return values
}

function checkTenantSecrets(json: unknown, path: string): TenantConfig['secrets'] {
	if (!isObject(json)) {
		return typeConfigError(path, json, 'object')
	}
	if (!('encryptionKey' in json)) {
		return undefined
	}
	if (!hasStringProperty(json, 'encryptionKey')) {
		return typeConfigError(path + '.encryptionKey', json.encryptionKey, 'string')
	}
	return {
		encryptionKey: json.encryptionKey,
	}
}
function checkTenantStructure(json: unknown): Config['tenant'] {
	if (!isObject(json)) {
		return typeConfigError('tenant', json, 'object')
	}
	return {
		db: checkDatabaseCredentials(json.db, 'tenant.db'),
		mailer: checkMailerParameters(json.mailer, 'tenant.mailer'),
		credentials: checkTenantCredentials(json.credentials, 'tenant.credentials'),
		secrets: checkTenantSecrets(json.secrets, 'tenant.secrets'),
	}
}

function checkStageStructure(json: unknown, slug: string, path: string): StageConfig {
	json = json || {}
	if (!isObject(json)) {
		return typeConfigError(path, json, 'object')
	}

	if (json.name && !hasStringProperty(json, 'name')) {
		return typeConfigError(path + '.name', json.name, 'string')
	}
	return { name: upperCaseFirst(slug), ...json, slug }
}

function checkProjectStructure(json: unknown, slug: string, path: string): ProjectConfig {
	if (!isObject(json)) {
		return typeConfigError(path, json, 'object')
	}

	if (json.name && !hasStringProperty(json, 'name')) {
		return typeConfigError(path + '.name', json.name, 'string')
	}
	if (!isObject(json.stages)) {
		return typeConfigError(`${path}.stages`, json.stages, 'object')
	}
	const stages = Object.entries(json.stages).map(([slug, value]) =>
		checkStageStructure(value, slug, `${path}.stages.${slug}`),
	)
	return {
		name: upperCaseFirst(slug).replace(/-/g, ' '),
		directory: `${slug}/api`,
		...json,
		slug,
		stages: stages,
		db: checkDatabaseCredentials(json.db, `${path}.db`),
	}
}

function checkServerStructure(json: unknown): Config['server'] {
	if (!isObject(json)) {
		return typeConfigError('server', json, 'object')
	}
	if (!hasNumberProperty(json, 'port')) {
		return typeConfigError('server.port', json.port, 'number')
	}
	if (!hasNumberProperty(json, 'monitoringPort')) {
		return typeConfigError('server.monitoringPort', json.monitoringPort, 'number')
	}
	return {
		...json,
		logging: checkLoggingStructure(json.logging),
		http: checkHttpStructure(json.http),
	}
}

function checkLoggingStructure(json: unknown): Config['server']['logging'] {
	if (!json) {
		return {}
	}
	if (!isObject(json)) {
		return typeConfigError('logging', json, 'object')
	}
	let sentry: Config['server']['logging']['sentry'] = undefined
	if (json.sentry) {
		if (!isObject(json.sentry)) {
			return typeConfigError('logging.sentry', json.sentry, 'object')
		}
		if (json.sentry.dsn) {
			if (!hasStringProperty(json.sentry, 'dsn')) {
				return typeConfigError('logging.sentry.dsn', json.sentry.dsn, 'string')
			}
			sentry = { dsn: json.sentry.dsn }
		}
	}

	return { sentry }
}

function checkHttpStructure(json: unknown): Config['server']['http'] {
	if (!json) {
		return {}
	}
	if (!isObject(json)) {
		return typeConfigError('http', json, 'object')
	}
	return json
}

function checkConfigStructure(json: unknown): Config {
	if (!isObject(json)) {
		return typeConfigError('', json, 'object')
	}
	return {
		...json,
		tenant: checkTenantStructure(json.tenant),
		server: checkServerStructure(json.server),
	}
}

const projectNameToEnvName = (projectName: string): string => {
	return projectName.toUpperCase().replace(/-/g, '_')
}

export type ConfigSource = { data: string; type: 'file' | 'json' | 'yaml' }

export async function readConfig(
	configSources: ConfigSource[],
	configProcessors: ConfigProcessor[] = [],
): Promise<{
	config: Config
	projectConfigResolver: ProjectConfigResolver
}> {
	const loader = new ConfigLoader()
	const configs = await Promise.all(
		configSources.map(it => (it.type === 'file' ? loader.load(it.data) : loader.loadString(it.data, it.type))),
	)
	const env: Record<string, string> = {
		...configProcessors.reduce((acc, curr) => ({ ...acc, ...(curr.getDefaultEnv?.() || {}) }), {
			DEFAULT_DB_PORT: '5432',
		}),
		...Object.fromEntries(Object.entries(process.env).filter((it): it is [string, string] => it[1] !== undefined)),
	}

	const defaultTemplate: any = {
		tenant: {
			db: {
				host: `%tenant.env.DB_HOST%`,
				port: `%tenant.env.DB_PORT::number%`,
				user: `%tenant.env.DB_USER%`,
				password: `%tenant.env.DB_PASSWORD%`,
				database: `%tenant.env.DB_NAME%`,
				ssl: `%?tenant.env.DB_SSL::bool%`,
			},
			mailer: {
				from: '%?tenant.env.MAILER_FROM%',
				host: '%?tenant.env.MAILER_HOST::string%',
				port: '%?tenant.env.MAILER_PORT::number%',
				secure: '%?tenant.env.MAILER_SECURE::bool%',
				user: '%?tenant.env.MAILER_USER%',
				password: '%?tenant.env.MAILER_PASSWORD%',
			},
			credentials: {
				rootEmail: '%?env.CONTEMBER_ROOT_EMAIL%',
				rootToken: '%?env.CONTEMBER_ROOT_TOKEN%',
				rootPassword: '%?env.CONTEMBER_ROOT_PASSWORD%',
				loginToken: '%?env.CONTEMBER_LOGIN_TOKEN%',
			},
			secrets: {
				encryptionKey: '%?env.CONTEMBER_ENCRYPTION_KEY%',
			},
		},
		projectDefaults: {
			db: {
				host: `%project.env.DB_HOST%`,
				port: `%project.env.DB_PORT::number%`,
				user: `%project.env.DB_USER%`,
				password: `%project.secret.db.password||project.env.DB_PASSWORD%`,
				ssl: `%?project.env.DB_SSL::bool%`,
				database: `%project.env.DB_NAME||project.slug%`,
			},
		},
		server: {
			port: '%env.CONTEMBER_PORT::number%',
			monitoringPort: '%env.CONTEMBER_MONITORING_PORT::number%',
			workerCount: '%?env.CONTEMBER_WORKER_COUNT::string%',
			http: {
				requestBodySize: '%?env.CONTEMBER_HTTP_REQUEST_BODY_SIZE::string%',
			},
			logging: {
				sentry: {
					dsn: '%?env.SENTRY_DSN%',
				},
			},
		},
	}

	const template = configProcessors.reduce(
		(tpl, processor) => processor.prepareConfigTemplate?.(tpl, { env }) || tpl,
		defaultTemplate,
	)

	let { projectDefaults, ...config } = Merger.merge(template, ...configs)

	const parametersResolver = createObjectParametersResolver({ env })
	config = resolveParameters(config, (parts, path, dataResolver) => {
		if (parts[0] === 'tenant') {
			if (path[0] !== 'tenant') {
				throw new Error(`Invalid use of ${parts.join('.')} variable in path ${path.join('.')}.`)
			}
			if (parts[1] === 'env') {
				const envName = parts[2]
				const envValue = env['TENANT_' + envName] || env['DEFAULT_' + envName]
				if (envValue === undefined) {
					throw new UndefinedParameterError(`ENV variable "${'TENANT_' + envName}" not found.`)
				}
				return envValue
			}
			throw new UndefinedParameterError(`Parameter "${parts.join('.')}" not found.`)
		}

		return parametersResolver(parts, path, dataResolver)
	})

	const baseConfig = configProcessors.reduce<Config>(
		(config, processor) => processor.processConfig?.<any>(config, { env }) || config,
		checkConfigStructure(config),
	)
	return {
		config: baseConfig,
		projectConfigResolver: (slug, additionalConfig, secrets) => {
			const mergedConfig = Merger.merge(
				projectDefaults as any,
				(config?.projects as any)?.[slug] as any,
				additionalConfig,
			)
			if (!mergedConfig.stages) {
				mergedConfig.stages = { live: { base: null } }
			}
			const resolvedConfig = resolveParameters(mergedConfig, (parts, path, dataResolver) => {
				if (parts[0] === 'project') {
					if (parts[1] === 'env') {
						const envName = parts[2]
						const projectEnvName = projectNameToEnvName(slug)
						const envValue = env[projectEnvName + '_' + envName] || env['DEFAULT_' + envName]
						if (envValue === undefined) {
							throw new UndefinedParameterError(`ENV variable "${projectEnvName + '_' + envName}" not found.`)
						}
						return envValue
					} else if (parts[1] === 'slug') {
						return slug
					} else if (parts[1] === 'secret') {
						const key = parts.slice(2).join('.')
						const value = secrets[key]
						if (value === undefined) {
							throw new UndefinedParameterError(`Project secret ${parts[2]} not found`)
						}
						return value
					}
				}
				throw new UndefinedParameterError(`Parameter "${parts.join('.')}" not found.`)
			})
			const projectConfig = checkProjectStructure(resolvedConfig, slug, 'project')

			return configProcessors.reduce(
				(config, processor) => processor.processProjectConfig?.(slug, config) ?? config,
				projectConfig,
			)
		},
	}
}
