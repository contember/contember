import { pathExists } from 'fs-extra'
import { join } from 'path'
import { readYaml, updateYaml } from './yaml'
import { installTemplate } from './template'
import { resourcesDir } from '../pathUtils'
import { InstanceManager } from './instance'
import { ProjectManager } from './ProjectManager'
import { PathMapping } from './PathMapping'
import * as path from 'path'
import { getCliVersion } from './contember'

interface WorkspaceDirectoryArgument {
	workspaceDirectory: string
}

export const createWorkspace = async ({
	workspaceDirectory,
	singleInstance,
	withAdmin,
	template,
}: {
	singleInstance: boolean
	withAdmin: boolean
	template: string
} & WorkspaceDirectoryArgument) => {
	if (singleInstance && withAdmin) {
		throw 'Single instance and admin is not supported combination'
	}
	template =
		template ||
		(withAdmin
			? '@contember/template-workspace-with-admin'
			: join(
					resourcesDir,
					singleInstance ? 'templates/template-workspace-single-instance' : 'templates/template-workspace',
			  ))
	const instanceName = path.basename(workspaceDirectory)
	await installTemplate(template, workspaceDirectory, 'workspace', {
		instanceName: instanceName,
		version: getCliVersion(),
	})
	const workspace = await Workspace.get(workspaceDirectory)
	const instance = singleInstance
		? await workspace.instances.getInstance(instanceName)
		: await workspace.instances.createInstance(instanceName, {})
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
