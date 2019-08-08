import Project from './Project'
import { ConfigLoader, Merger } from 'cms-server-common'
import { deprecated } from '../core/console/messages'

export type DatabaseCredentials = Project.DatabaseCredentials

export interface Config {
	tenant: {
		db: DatabaseCredentials
	}
	projects: Array<Project>
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

function hasArrayProperty<Input extends UnknownObject, Property extends string>(
	input: Input,
	property: Property,
): input is Input & { [key in Property]: unknown[] } {
	return Array.isArray(input[property])
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

function checkS3Config(json: unknown, path: string): Project.S3Config {
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

function checkS3Credentials(json: unknown, path: string): Project.S3Config['credentials'] {
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

function checkIdProperty<Input extends UnknownObject>(json: Input, path: string): string {
	if (!hasStringProperty(json, 'id') && hasStringProperty(json, 'uuid')) {
		console.warn(deprecated(`Property ${path}.id in config file is deprecated, use ${path}.id instead`))
		return json.uuid
	}
	if (!hasStringProperty(json, 'id')) {
		return typeError(path + '.uuid', json.uuid, 'string')
	}
	return json.id
}

function checkStageStructure(json: unknown, path: string): Project.Stage {
	if (!isObject(json)) {
		return typeError(path, json, 'object')
	}

	if (!hasStringProperty(json, 'slug')) {
		return typeError(path + '.slug', json.slug, 'string')
	}
	if (!hasStringProperty(json, 'name')) {
		return typeError(path + '.name', json.name, 'string')
	}
	return { ...json, id: checkIdProperty(json, path) }
}

function checkProjectStructure(json: unknown, path: string): Project {
	if (!isObject(json)) {
		return typeError(path, json, 'object')
	}

	if (!hasStringProperty(json, 'slug')) {
		return typeError(path + '.slug', json.slug, 'string')
	}
	if (!hasStringProperty(json, 'name')) {
		return typeError(path + '.name', json.name, 'string')
	}
	if (!hasArrayProperty(json, 'stages')) {
		return error(`Property ${path}.stages should be an array in config file`)
	}
	return {
		...json,
		id: checkIdProperty(json, path),
		stages: json.stages.map((stage, i) => checkStageStructure(stage, `${path}.stages${i}`)),
		dbCredentials: checkDatabaseCredentials(json.dbCredentials, `${path}.dbCredentials`),
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
	if (!hasArrayProperty(json, 'projects')) {
		return error('Property projects should be an array in config file')
	}

	return {
		...json,
		projects: json.projects.map((it, i) => checkProjectStructure(it, `projects[${i}]`)),
		tenant: checkTenantStructure(json.tenant),
		server: checkServerStructure(json.server),
	}
}

export async function readConfig(...filenames: string[]): Promise<Config> {
	const loader = new ConfigLoader()

	const configs = await Promise.all(
		filenames.map(it =>
			loader.load(it, {
				env: process.env,
			}),
		),
	)
	const config = Merger.merge(...configs)

	return checkConfigStructure(config)
}
