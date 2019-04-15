import Project from './Project'
import { ConfigLoader } from 'cms-server-common'
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

function checkDatabaseCredentials(json: any, path: string): void {
	if (json.host === undefined) {
		error(`Undefined property ${path}.host in config file`)
	}
	if (json.port === undefined) {
		error(`Undefined property ${path}.port in config file`)
	}
	if (json.user === undefined) {
		error(`Undefined property ${path}.user in config file`)
	}
	if (json.password === undefined) {
		error(`Undefined property ${path}.password in config file`)
	}
	if (json.database === undefined) {
		error(`Undefined property ${path}.database in config file`)
	}
}

function checkS3Config(json: any, path: string): void {
	if (json.bucket === undefined) {
		error(`Undefined property ${path}.bucket in config file`)
	}
	if (json.prefix === undefined) {
		error(`Undefined property ${path}.prefix in config file`)
	}
	if (json.region === undefined) {
		error(`Undefined property ${path}.region in config file`)
	}
	if (json.credentials === undefined) {
		error(`Undefined property ${path}.credentials in config file`)
	}
	if (json.credentials.key === undefined) {
		error(`Undefined property ${path}.credentials.key in config file`)
	}
	if (json.credentials.secret === undefined) {
		error(`Undefined property ${path}.credentials.secret in config file`)
	}
}

function checkConfigStructure(json: any): void {
	if (json.tenant === undefined) {
		error('Undefined property tenant in config file')
	}
	if (json.tenant.db === undefined) {
		error('Undefined property tenant.db in config file')
	}
	checkDatabaseCredentials(json.tenant.db, 'tenant.db')
	if (json.projects === undefined) {
		error('Undefined property projects in config file')
	}
	if (!Array.isArray(json.projects)) {
		error('Property projects should be an array in config file')
	}
	let i = 0
	for (const project of json.projects) {
		if (project.id === undefined) {
			if (project.uuid !== undefined) {
				project.id = project.uuid
				console.warn(
					deprecated(`Property projects[${i}].uuid in config file is deprecated, use projects[${i}].id instead`)
				)
			} else {
				error(`Undefined property projects[${i}].uuid in config file`)
			}
		}
		if (project.slug === undefined) {
			error(`Undefined property projects[${i}].slug in config file`)
		}
		if (project.name === undefined) {
			error(`Undefined property projects[${i}].name in config file`)
		}
		if (project.stages === undefined) {
			error(`Undefined property projects[${i}].stages in config file`)
		}
		if (!Array.isArray(project.stages)) {
			error(`Property projects[${i}].stages should be an array in config file`)
		}
		let j = 0
		for (const stage of project.stages) {
			if (stage.id === undefined) {
				if (stage.uuid !== undefined) {
					console.warn(
						deprecated(
							`Property projects[${i}].stages[${j}].uuid in config file is deprecated, use projects[${i}].stages[${j}].id instead`
						)
					)
				} else {
					error(`Undefined property projects[${i}].stages[${j}].uuid in config file`)
				}
			}
			if (stage.slug === undefined) {
				error(`Undefined property projects[${i}}.stages[${j}].slug in config file`)
			}
			if (stage.name === undefined) {
				error(`Undefined property projects[${i}}.stages[${j}].name in config file`)
			}
			j++
		}
		if (project.dbCredentials === undefined) {
			error(`Property projects[${i}].dbCredentials should be an array in config file`)
		}
		checkDatabaseCredentials(project.dbCredentials, `projects[${i}].dbCredentials`)
		checkS3Config(project.s3, `projects[${i}].s3`)
		i++
	}
	if (json.server === undefined) {
		error(`Undefined property server in config file`)
	}
	if (json.server.port === undefined) {
		error(`Undefined property server.port in config file`)
	}
}

export async function readConfig(filename: string): Promise<Config> {
	const loader = new ConfigLoader()
	const config = await loader.load(filename, {
		env: process.env,
	})
	checkConfigStructure(config)
	return config
}
