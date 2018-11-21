import Project from './Project'
import { Loader } from 'cms-common'

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

function checkS3Config(json: any, path: string): void {
	if (typeof json.bucket === 'undefined') {
		error(`Undefined property ${path}.bucket in config file`)
	}
	if (typeof json.prefix === 'undefined') {
		error(`Undefined property ${path}.prefix in config file`)
	}
	if (typeof json.region === 'undefined') {
		error(`Undefined property ${path}.region in config file`)
	}
	if (typeof json.credentials === 'undefined') {
		error(`Undefined property ${path}.credentials in config file`)
	}
	if (typeof json.credentials.key === 'undefined') {
		error(`Undefined property ${path}.credentials.key in config file`)
	}
	if (typeof json.credentials.secret === 'undefined') {
		error(`Undefined property ${path}.credentials.secret in config file`)
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
		checkS3Config(project.s3, `projects[${i}].s3`)
		i++
	}
	if (typeof json.server === 'undefined') {
		error(`Undefined property server in config file`)
	}
	if (typeof json.server.port === 'undefined') {
		error(`Undefined property server.port in config file`)
	}
}

export async function readConfig(filename: string): Promise<Config> {
	const loader = new Loader()
	const config = await loader.load(filename, {
		env: process.env,
	})
	checkConfigStructure(config)
	return config
}
