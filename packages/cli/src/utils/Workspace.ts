import { pathExists } from 'fs-extra'
import * as path from 'path'
import { basename, join } from 'path'
import { readYaml, updateYaml } from './yaml'
import { installTemplate } from './template'
import { ProjectManager } from './ProjectManager'
import { PathMapping } from './PathMapping'
import { getCliVersion } from './contember'

interface WorkspaceDirectoryArgument {
	workspaceDirectory: string
}

export const createWorkspace = async ({
	workspaceDirectory,
	template,
}: {
	template?: string
} & WorkspaceDirectoryArgument) => {
	template ??= 'templates/template-workspace-single-instance'
	const instanceName = path.basename(workspaceDirectory)
	await installTemplate(template, workspaceDirectory, 'workspace', {
		instanceName: instanceName,
		version: getCliVersion(),
	})
	const workspace = await Workspace.get(workspaceDirectory)
	const project = await workspace.projects.createProject('sandbox', {})
	await project.register()
}

export interface WorkspaceConfig {
	api?: {
		version?: string
		configFile?: string
	}
	admin?: {
		enabled?: boolean
		projectsFile?: string
	}
	instances?: PathMapping
	projects?: PathMapping
}

export class Workspace {
	public readonly projects = new ProjectManager(this)

	constructor(public readonly directory: string, public readonly config: WorkspaceConfig) {}

	public static async get(workspaceDirectory: string) {
		const config = await readWorkspaceConfig({ workspaceDirectory })
		return new Workspace(workspaceDirectory, config)
	}

	get name() {
		return basename(this.directory)
	}

	get adminEnabled(): boolean {
		return this.config?.admin?.enabled || false
	}

	get apiVersion(): string | undefined {
		return this.config?.api?.version || undefined
	}

	get apiConfigFile(): string {
		return path.resolve(this.directory, this.config.api?.configFile || 'api/config.yaml')
	}

	get adminProjectsFile(): string {
		return path.resolve(this.directory, this.config.admin?.projectsFile || 'admin/src/projects.ts')
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
