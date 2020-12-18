import { Instance } from './Instance'
import { readInstanceConfig, validateInstanceName } from './instance'
import { Workspace } from './Workspace'
import { join } from 'path'
import { pathExists } from 'fs-extra'
import { resourcesDir } from '../pathUtils'
import { installTemplate } from './template'
import { updateMainDockerComposeConfig } from './dockerCompose'
import { getPathFromMapping, listEntriesInMapping, resolvePathMappingConfig } from './PathMapping'

export class InstanceManager {
	constructor(private readonly workspace: Workspace) {}

	async listInstances(): Promise<Instance[]> {
		let instancesConfig = await this.getInstancePathMapping()
		const instances = await listEntriesInMapping(instancesConfig)
		return await Promise.all(instances.map(it => this.getInstance(it)))
	}

	async getInstance(name: string): Promise<Instance> {
		validateInstanceName(name)
		const instanceDirectory = await this.getDirectory(name)
		await this.verifyInstanceExists(instanceDirectory, name)
		return new Instance(name, instanceDirectory, await readInstanceConfig({ instanceDirectory }))
	}

	async createInstance(name: string, options: { template?: string }): Promise<Instance> {
		validateInstanceName(name)
		const withAdmin = this.workspace.adminEnabled
		const template =
			options.template ||
			(withAdmin ? '@contember/template-instance-with-admin' : join(resourcesDir, 'templates/template-instance'))
		const instanceDirectory = await this.getDirectory(name)
		await installTemplate(template, instanceDirectory, 'instance')
		const version = await this.workspace.apiVersion
		await updateMainDockerComposeConfig(instanceDirectory, (config: any) => ({
			...config,
			services: {
				...config.services,
				api: {
					...config.services.api,
					image: 'contember/contember:' + (version || 'latest'),
				},
			},
		}))
		return new Instance(name, instanceDirectory, await readInstanceConfig({ instanceDirectory }))
	}

	async getDefaultInstance(): Promise<Instance> {
		const instances = await this.listInstances()
		if (instances.length !== 1) {
			throw 'Please specify an instance'
		}
		return instances[0]
	}

	private async getDirectory(name: string) {
		return getPathFromMapping(await this.getInstancePathMapping(), name)
	}

	private async getInstancePathMapping(): Promise<Record<string, string>> {
		return resolvePathMappingConfig(this.workspace.directory, 'instances', this.workspace.config.instances)
	}

	private async verifyInstanceExists(dir: string, name: string) {
		if (!(await pathExists(dir))) {
			throw `Instance ${name} not found.`
		}
	}
}
