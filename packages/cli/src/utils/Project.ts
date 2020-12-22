import { pathExists } from 'fs-extra'
import * as path from 'path'
import { promises as fs } from 'fs'
import { updateYaml } from './yaml'
import { updateMainDockerComposeConfig } from './dockerCompose'
import { Instance } from './Instance'
import { Workspace } from './Workspace'
import { projectNameToEnvName } from '@contember/engine-common'

export class Project {
	constructor(
		public readonly name: string,
		private readonly directory: string,
		private readonly workspace: Workspace,
	) {}

	get adminDir() {
		return path.join(this.directory, 'admin')
	}

	get apiDir() {
		return path.join(this.directory, 'api')
	}

	get migrationsDir() {
		return path.join(this.apiDir, 'migrations')
	}

	async registerToInstance(instance: Instance) {
		const adminPath = instance.adminProjectsFile
		if (await pathExists(adminPath)) {
			const relativePath = path.relative(path.dirname(adminPath), this.adminDir)
			const code = `export { default as ${this.name.replace('-', '_')} } from '${relativePath}'\n`
			await fs.appendFile(adminPath, code, { encoding: 'utf8' })
		}

		await updateYaml(instance.apiConfigFile, (config, { merge }) =>
			merge(config, {
				projects: {
					[this.name]: {
						stages: { live: null },
					},
				},
			}),
		)
		await updateMainDockerComposeConfig(instance.directory, (config: any) => ({
			...config,
			services: {
				...config.services,
				api: {
					...config.services.api,
					environment: {
						...config.services.api.environment,
						[projectNameToEnvName(this.name) + '_DB_NAME']: this.name,
					},
				},
			},
		}))
	}
}

export const validateProjectName = (name: string) => {
	if (!name.match(/^[a-z][-a-z0-9]*$/i)) {
		throw 'Invalid project name. It can contain only alphanumeric characters, dash and must start with a letter'
	}
}
