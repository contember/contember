import {
	ConfigLoader,
	createObjectParametersResolver,
	Merger,
	resolveParameters,
	UndefinedParameterError,
} from '@contember/config-loader'
import { upperCaseFirst } from '../utils'
import { ConfigProcessor } from '@contember/engine-plugins'
import { Typesafe } from '@contember/engine-common'
import { ProjectConfigResolver } from '@contember/engine-http'
import { MailerOptions } from '@contember/engine-tenant-api'

export type Config = ReturnType<typeof configSchema>
export type TenantConfig = Config['tenant']

const dbCredentialsSchema = Typesafe.intersection(
	Typesafe.object({
		host: Typesafe.string,
		port: Typesafe.number,
		user: Typesafe.string,
		password: Typesafe.string,
		database: Typesafe.string,
	}),
	Typesafe.partial({
		ssl: Typesafe.boolean,
	}),
)

const tenantConfigSchema = Typesafe.intersection(
	Typesafe.object({
		db: dbCredentialsSchema,
		mailer: Typesafe.transform(Typesafe.partial({
			from: Typesafe.string,
			host: Typesafe.string,
			port: Typesafe.number,
			user: Typesafe.string,
			password: Typesafe.string,
		}), (value, input): MailerOptions => {
			return {
				...(input as MailerOptions),
				...value,
				...(value.user ? { auth: { user: value.user, pass: value.password } } : {}),
			}
		}),
		credentials: Typesafe.partial({
			rootToken: Typesafe.string,
			rootPassword: Typesafe.string,
			rootEmail: Typesafe.string,
			loginToken: Typesafe.string,
		}),
	}),
	Typesafe.object({
		secrets: Typesafe.partial({
			encryptionKey: Typesafe.string,
		}),
	}),
)
const serverConfigSchema = Typesafe.intersection(
	Typesafe.object({
		port: Typesafe.number,
		monitoringPort: Typesafe.number,
		http: Typesafe.partial({
			requestBodySize: Typesafe.string,
		}),
		logging: Typesafe.union(
			val => Typesafe.valueAt(val, ['sentry', 'dsn']) === undefined ? {} : Typesafe.fail([]),
			Typesafe.partial({
				sentry: Typesafe.object({
					dsn: Typesafe.string,
				}),
			}),
		),
	}),
	Typesafe.partial({
		workerCount: Typesafe.union(Typesafe.number, Typesafe.string),
		projectGroup: (val, path) => Typesafe.valueAt(val, ['domainMapping']) === undefined ? undefined : Typesafe.object({
			domainMapping: Typesafe.string,
		})(val, path),
	}),
)
const configSchema = Typesafe.object({
	tenant: tenantConfigSchema,
	server: serverConfigSchema,
})

const stageConfig = Typesafe.map(Typesafe.object({
	name: Typesafe.union(
		Typesafe.string,
		(_, path = []) => upperCaseFirst(String(path[path.length - 2])),
	),
	slug: (_, path = []) => String(path[path.length - 2]),
}))

const projectConfigSchema = Typesafe.object({
	name: Typesafe.union(
		Typesafe.string,
		(_, path = []) => upperCaseFirst(String(path[path.length - 2])).replace(/-/g, ' '),
	),
	slug: (_, path = []) => String(path[path.length - 2]),
	stages: (input, path = []) => Object.values(stageConfig(input, path)),
	db: dbCredentialsSchema,
})

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
		projectGroup: {
			domainMapping: '%?env.CONTEMBER_PROJECT_GROUP_DOMAIN_MAPPING%',
		},
		logging: {
			sentry: {
				dsn: '%?env.SENTRY_DSN%',
			},
		},
	},
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

	const baseConfig = configSchema(config)
	return {
		config: baseConfig,
		projectConfigResolver: (slug, additionalConfig, secrets) => {
			const mergedConfig = Merger.merge(
				projectDefaults as any,
				(config?.projects as any)?.[slug] as any,
				additionalConfig,
			)
			if (!mergedConfig.stages) {
				mergedConfig.stages = { live: {} }
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

			const projectConfigSchemaWithPlugins = configProcessors.reduce(
				(schema, current) => (
					current.getProjectConfigSchema ? Typesafe.intersection(schema, current.getProjectConfigSchema(slug)) : schema
				),
				projectConfigSchema,
			)
			const projectConfig = projectConfigSchemaWithPlugins(resolvedConfig, ['project', slug])
			return projectConfig
		},
	}
}
