import Project from './Project'
import {
	ConfigLoader,
	createObjectParametersResolver,
	Merger,
	resolveParameters,
	UndefinedParameterError,
} from '@contember/config-loader'
import { deprecated } from '../core/console/messages'
import { DatabaseCredentials } from '@contember/engine-common'
import { S3Config } from '@contember/engine-s3-plugin/dist/src/Config'
import { tuple, upperCaseFirst } from '../utils'

export type ProjectWithS3 = Project & { s3?: S3Config }

export interface Config {
	tenant: {
		db: DatabaseCredentials
	}
	projects: Record<string, ProjectWithS3>
	server: {
		port: number
	}
}

class InvalidConfigError extends Error {}

function error(err: string): never {
	throw new InvalidConfigError(err)
}

function typeError(property: string, value: any, expectedType: string): never {
	return error(`Invalid property ${property} in config file. ${expectedType} expected, ${typeof value} found`)
}

type UnknownObject = Record<string, unknown>

function isObject(input: unknown): input is UnknownObject {
	return typeof input === 'object' && input !== null
}

function hasStringProperty<Input extends UnknownObject, Property extends string>(
	input: Input,
	property: Property,
): input is Input & { [key in Property]: string } {
	return typeof input[property] === 'string'
}

function hasNumberProperty<Input extends UnknownObject, Property extends string>(
	input: Input,
	property: Property,
): input is Input & { [key in Property]: number } {
	return typeof input[property] === 'number'
}

function checkDatabaseCredentials(json: unknown, path: string): DatabaseCredentials {
	if (!isObject(json)) {
		return error(`Property ${path} must be an object`)
	}
	if (!hasStringProperty(json, 'host')) {
		return typeError(path + '.host', json.host, 'string')
	}
	if (!hasNumberProperty(json, 'port')) {
		if (hasStringProperty({ ...json }, 'port')) {
			console.warn(
				deprecated(`Property ${path}.port must be a number, but string was found. Use ::number typecast in config.`),
			)
			json.port = Number(json.port)
		} else {
			return typeError(path + '.port', json.port, 'number')
		}
	}
	if (!hasNumberProperty(json, 'port')) {
		throw new Error('impl error')
	}
	if (!hasStringProperty(json, 'user')) {
		return typeError(path + '.user', json.user, 'string')
	}
	if (!hasStringProperty(json, 'password')) {
		return typeError(path + '.password', json.password, 'string')
	}
	if (!hasStringProperty(json, 'database')) {
		return typeError(path + '.database', json.database, 'string')
	}
	return json
}

function checkS3Config(json: unknown, path: string): S3Config {
	if (!isObject(json)) {
		return error(`Property ${path} must be an object`)
	}
	if (!hasStringProperty(json, 'bucket')) {
		return typeError(path + '.bucket', json.bucket, 'string')
	}
	if (!hasStringProperty(json, 'prefix')) {
		return typeError(path + '.prefix', json.prefix, 'string')
	}
	if (!hasStringProperty(json, 'region')) {
		return typeError(path + '.region', json.region, 'string')
	}

	return { ...json, credentials: checkS3Credentials(json.credentials, `${path}.credentials`) }
}

function checkS3Credentials(json: unknown, path: string): S3Config['credentials'] {
	if (!isObject(json)) {
		return typeError(path, json, 'object')
	}
	if (!hasStringProperty(json, 'key')) {
		return typeError(path + '.key', json.key, 'string')
	}
	if (!hasStringProperty(json, 'secret')) {
		return typeError(path + '.secret', json.secret, 'string')
	}
	return json
}

function checkTenantStructure(json: unknown): Config['tenant'] {
	if (!isObject(json)) {
		return typeError('tenant', json, 'object')
	}
	return { db: checkDatabaseCredentials(json.db, 'tenant.db') }
}

function checkStageStructure(json: unknown, slug: string, path: string): Project.Stage {
	json = json || {}
	if (!isObject(json)) {
		return typeError(path, json, 'object')
	}

	if (json.name && !hasStringProperty(json, 'name')) {
		return typeError(path + '.name', json.name, 'string')
	}
	return { name: upperCaseFirst(slug), ...json, slug }
}

function checkProjectStructure(json: unknown, slug: string, path: string): ProjectWithS3 {
	if (!isObject(json)) {
		return typeError(path, json, 'object')
	}

	if (json.name && !hasStringProperty(json, 'name')) {
		return typeError(path + '.name', json.name, 'string')
	}
	if (!isObject(json.stages)) {
		return error(`Property ${path}.stages should be an object in config file`)
	}
	if (json.dbCredentials) {
		console.warn(`${path}.dbCredentials is deprecated, use ${path}.db instead`)
		json.db = json.dbCredentials
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
		s3: checkS3Config(json.s3, `${path}.s3`),
	}
}

function checkServerStructure(json: unknown): Config['server'] {
	if (!isObject(json)) {
		return typeError('server', json, 'object')
	}
	if (!hasNumberProperty(json, 'port')) {
		if (hasStringProperty({ ...json }, 'port')) {
			console.warn(
				deprecated(`Property server.port must be a number, but string was found. Use ::number typecast in config.`),
			)
			json.port = Number(json.port)
		} else {
			return typeError('server.port', json.port, 'number')
		}
	}
	if (!hasNumberProperty(json, 'port')) {
		throw new Error('impl error')
	}
	return json
}

function checkConfigStructure(json: unknown): Config {
	if (!isObject(json)) {
		return error('Invalid input type')
	}
	if (!isObject(json.projects)) {
		return error('Property projects should be an object in config file')
	}

	const projects = Object.entries(json.projects).map(([slug, value]) =>
		tuple(slug, checkProjectStructure(value, slug, `projects.${slug}`)),
	)
	return {
		...json,
		projects: Object.fromEntries(projects),
		tenant: checkTenantStructure(json.tenant),
		server: checkServerStructure(json.server),
	}
}

const projectNameToEnvName = (projectName: string): string => {
	return projectName.toUpperCase().replace(/-/g, '_')
}

export async function readConfig(...filenames: string[]): Promise<Config> {
	const loader = new ConfigLoader()

	const configs = await Promise.all(filenames.map(it => loader.load(it)))
	const env: Record<string, string> = {
		DEFAULT_DB_PORT: '5432',
		DEFAULT_S3_PREFIX: '',
		DEFAULT_S3_ENDPOINT: '',
		DEFAULT_S3_REGION: 'us-east-1',
		DEFAULT_S3_PROVIDER: 'aws',
		...process.env,
	}
	const defaultConfig: any = {
		tenant: {
			db: {
				host: `%tenant.env.DB_HOST%`,
				port: `%tenant.env.DB_PORT::number%`,
				user: `%tenant.env.DB_USER%`,
				password: `%tenant.env.DB_PASSWORD%`,
				database: `%tenant.env.DB_NAME%`,
			},
		},
		projectDefaults: {
			db: {
				host: `%project.env.DB_HOST%`,
				port: `%project.env.DB_PORT::number%`,
				user: `%project.env.DB_USER%`,
				password: `%project.env.DB_PASSWORD%`,
				database: `%project.env.DB_NAME%`,
			},
		},
		server: {
			port: '%env.CONTEMBER_PORT::number%',
		},
	}

	const hasS3config = Object.keys(env).find(it => it.endsWith('_S3_KEY'))
	if (hasS3config) {
		defaultConfig.projectDefaults.s3 = {
			bucket: `%project.env.S3_BUCKET%`,
			prefix: `%project.env.S3_PREFIX%`,
			region: `%project.env.S3_REGION%`,
			endpoint: `%project.env.S3_ENDPOINT%`,
			provider: '%project.env.S3_PROVIDER%',
			credentials: {
				key: `%project.env.S3_KEY%`,
				secret: `%project.env.S3_SECRET%`,
			},
		}
	}

	let { projectDefaults, ...config } = Merger.merge(defaultConfig, ...configs)
	if (typeof projectDefaults === 'object' && projectDefaults !== null && typeof config.projects === 'object') {
		const projectsWithDefaults = Object.entries(config.projects).map(([slug, project]) =>
			tuple(slug, Merger.merge(projectDefaults as any, project as any)),
		)
		config.projects = Object.fromEntries(projectsWithDefaults)
	}
	const parametersResolver = createObjectParametersResolver({ env })
	config = resolveParameters(config, (parts, path, dataResolver) => {
		if (parts[0] === 'project') {
			if (path[0] !== 'projects' || typeof path[1] !== 'string') {
				throw new Error(`Invalid use of ${parts.join('.')} variable in path ${path.join('.')}.`)
			}
			const projectSlug = path[1]
			if (parts[1] === 'env') {
				const envName = parts[2]
				const projectEnvName = projectNameToEnvName(projectSlug)
				const envValue = env[projectEnvName + '_' + envName] || env['DEFAULT_' + envName]
				if (envValue === undefined) {
					throw new UndefinedParameterError(`ENV variable "${projectEnvName + '_' + envName}" not found.`)
				}
				return envValue
			} else if (parts[1] === 'slug') {
				return projectSlug
			}
		}
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

	const configValidated = checkConfigStructure(config)
	console.dir(configValidated.projects.lmc)
	return configValidated
}
