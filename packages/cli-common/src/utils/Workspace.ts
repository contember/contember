import { basename, join } from 'path'
import { ProjectManager } from './ProjectManager'
import { PathMapping } from './PathMapping'
import { installTemplate } from './template'
import { getPackageVersion } from './version'
import { pathExists } from 'fs-extra'
import { readYaml } from './yaml'
import { CliEnv, readCliEnv } from '../application'

export interface WorkspaceDirectoryArgument {
	workspaceDirectory: string
}

type CreateWorkspaceArgs = {
	workspaceName: string
	template?: string
} & WorkspaceDirectoryArgument

export const createWorkspace = async ({ workspaceDirectory, workspaceName, template }: CreateWorkspaceArgs) => {
	template ??= '@contember/template-workspace'
	await installTemplate(template, workspaceDirectory, 'workspace', {
		version: getPackageVersion(),
		projectName: workspaceName,
	})
	const workspace = await Workspace.get(workspaceDirectory)
	await workspace.projects.createProject(workspaceName, {})
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
	projects?: PathMapping
}

export class Workspace {
	public readonly projects = new ProjectManager(this)

	constructor(
		public readonly directory: string,
		public readonly env: CliEnv,
		public readonly config: WorkspaceConfig,
	) {}

	public static async get(workspaceDirectory: string) {
		const config = await readWorkspaceConfig({ workspaceDirectory })
		return new Workspace(workspaceDirectory, readCliEnv(), config)
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


	public isSingleProjectMode(): boolean {
		return !!this.env.projectName
	}
}

export const formatWorkspaceConfigPath = (workspaceDirectory: string) => [
	join(workspaceDirectory, 'contember.yaml'),
	join(workspaceDirectory, 'contember.workspace.yaml'),
]

const readWorkspaceConfig = async ({ workspaceDirectory }: WorkspaceDirectoryArgument): Promise<WorkspaceConfig> => {
	const configPath = formatWorkspaceConfigPath(workspaceDirectory)
	for (const file of configPath) {
		if ((await pathExists(file))) {
			return await readYaml(file)
		}
	}
	return {}
}
