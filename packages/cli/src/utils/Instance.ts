import { getInstanceStatus, InstanceConfig, readInstanceConfig, ServiceStatus } from './instance'
import * as path from 'path'

export class Instance {
	constructor(
		public readonly name: string,
		public readonly directory: string,
		public readonly config: InstanceConfig,
	) {}

	async getStatus(): Promise<ServiceStatus[]> {
		return await getInstanceStatus(this)
	}

	get apiConfigFile(): string {
		return path.resolve(this.directory, this.config.api?.configFile || 'api/config.yaml')
	}

	get adminProjectsFile(): string {
		return path.resolve(this.directory, this.config.admin?.projectsFile || 'admin/src/projects.ts')
	}
}
