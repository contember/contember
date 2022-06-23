import { basename, join } from 'path'
import { ProjectManager } from './ProjectManager.js'
import { PathMapping } from './PathMapping.js'
import { installTemplate } from './template.js'
import { getPackageVersion } from './version.js'
import { readYaml } from './yaml.js'
import { CliEnv, readCliEnv } from '../application/index.js'
import { pathExists } from './fs.js'

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
		version: await getPackageVersion(),
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
