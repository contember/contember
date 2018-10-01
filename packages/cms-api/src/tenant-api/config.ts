import Project from './Project'
import * as yaml from 'js-yaml'

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

function checkDatabaseCredentials(json: any, path: string): void {
	if (typeof json.host === 'undefined') {
		error(`Undefined property ${path}.host in config file`)
	}
	if (typeof json.port === 'undefined') {
		error(`Undefined property ${path}.port in config file`)
	}
	if (typeof json.user === 'undefined') {
		error(`Undefined property ${path}.user in config file`)
	}
	if (typeof json.password === 'undefined') {
		error(`Undefined property ${path}.password in config file`)
	}
	if (typeof json.database === 'undefined') {
		error(`Undefined property ${path}.database in config file`)
	}
}

function checkConfigStructure(json: any): void {
	if (typeof json.tenant === 'undefined') {
		error('Undefined property tenant in config file')
	}
	if (typeof json.tenant.db === 'undefined') {
		error('Undefined property tenant.db in config file')
	}
	checkDatabaseCredentials(json.tenant.db, 'tenant.db')
	if (typeof json.projects === 'undefined') {
		error('Undefined property projects in config file')
	}
	if (typeof json.projects[Symbol.iterator] !== 'function') {
		error('Property projects should be an array in config file')
	}
	let i = 0
	for (const project of json.projects) {
		if (typeof project.uuid === 'undefined') {
			error(`Undefined property projects[${i}].uuid in config file`)
		}
		if (typeof project.slug === 'undefined') {
			error(`Undefined property projects[${i}].slug in config file`)
		}
		if (typeof project.name === 'undefined') {
			error(`Undefined property projects[${i}].name in config file`)
		}
		if (typeof project.stages === 'undefined') {
			error(`Undefined property projects[${i}].stages in config file`)
		}
		if (typeof project.stages[Symbol.iterator] !== 'function') {
			error(`Property projects[${i}].stages should be an array in config file`)
		}
		let j = 0
		for (const stage of project.stages) {
			if (typeof stage.uuid === 'undefined') {
				error(`Undefined property projects[${i}}.stages[${j}].uuid in config file`)
			}
			if (typeof stage.slug === 'undefined') {
				error(`Undefined property projects[${i}}.stages[${j}].slug in config file`)
			}
			if (typeof stage.name === 'undefined') {
				error(`Undefined property projects[${i}}.stages[${j}].name in config file`)
			}
			j++
		}
		if (typeof project.dbCredentials === 'undefined') {
			error(`Property projects[${i}].dbCredentials should be an array in config file`)
		}
		checkDatabaseCredentials(project.dbCredentials, `projects[${i}].dbCredentials`)
		i++
	}
}

function replaceEnv(data: any): any {
	if (Array.isArray(data)) {
		return data.map(it => replaceEnv(it))
	}
	if (typeof data === 'string') {
		return data.replace(/^%env\.(\w+)%$/, (match, name) => {
			return String(process.env[name])
		})
	}
	if (data === null) {
		return data
	}
	if (typeof data === 'object') {
		return Object.entries(data)
			.map(([key, value]: [string, any]) => [key, replaceEnv(value)])
			.reduce((result, [key, value]) => ({ ...result, [key]: value }), {})
	}
	return data
}

export function parseConfig(input: string): Config {
	const parsed = yaml.safeLoad(input)
	checkConfigStructure(parsed)
	const configWithEnv = replaceEnv(parsed)
	return configWithEnv
}
