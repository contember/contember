import { pathExists } from 'fs-extra'
import { join } from 'path'
import { readYaml, updateYaml } from './yaml'
import { installTemplate } from './template'
import { resourcesDir } from '../pathUtils'
import { InstanceManager } from './InstanceManager'
import { ProjectManager } from './ProjectManager'
import { PathMapping } from './PathMapping'

interface WorkspaceDirectoryArgument {
	workspaceDirectory: string
}

export const createWorkspace = async ({
	workspaceDirectory,
	withAdmin,
	template,
}: {
	withAdmin: boolean
	template: string
} & WorkspaceDirectoryArgument) => {
	template =
		template ||
		(withAdmin ? '@contember/template-workspace-with-admin' : join(resourcesDir, 'templates/template-workspace'))
	await installTemplate(template, workspaceDirectory, 'workspace')

	const workspace = await Workspace.get(workspaceDirectory)
	const instance = await workspace.instances.createInstance('default', {})
	const project = await workspace.projects.createProject('sandbox', {})
	await project.registerToInstance(instance)
}

export interface WorkspaceConfig {
	api?: {
		version?: string
	}
	admin?: {
		enabled?: boolean
	}
	instances?: PathMapping
	projects?: PathMapping
}

export class Workspace {
	public readonly instances = new InstanceManager(this)
	public readonly projects = new ProjectManager(this)

	constructor(public readonly directory: string, public readonly config: WorkspaceConfig) {}

	public static async get(workspaceDirectory: string) {
		const config = await readWorkspaceConfig({ workspaceDirectory })
		return new Workspace(workspaceDirectory, config)
	}

	get adminEnabled(): boolean {
		return this.config?.admin?.enabled || false
	}

	get apiVersion(): string | undefined {
		return this.config?.api?.version || undefined
	}

	async updateApiVersion(newVersion: string) {
		const configPath = formatConfigPath(this.directory)
		if (!(await pathExists(configPath))) {
			return false
		}
		await updateYaml(configPath, data => {
			return {
				...data,
				api: {
					...(typeof data.api === 'object' ? data.api : {}),
					version: newVersion,
				},
			}
		})
		return true
	}
}

const formatConfigPath = (workspaceDirectory: string) => join(workspaceDirectory, 'contember.workspace.yaml')

const readWorkspaceConfig = async ({ workspaceDirectory }: WorkspaceDirectoryArgument): Promise<WorkspaceConfig> => {
	const configPath = formatConfigPath(workspaceDirectory)
	if (!(await pathExists(configPath))) {
		return {}
	}
	return await readYaml(configPath)
}
