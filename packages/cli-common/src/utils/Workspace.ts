import { basename, join } from 'node:path'
import { ProjectManager } from './ProjectManager'
import { PathMapping } from './PathMapping'
import { installTemplate } from './template'
import { getPackageVersion } from './version'
import { readYaml } from './yaml'
import { CliEnv, readCliEnv } from '../application'
import { pathExists } from './fs'
import { PackageWorkspace, PackageWorkspaceResolver } from '../npm/PackageWorkspace'
import { FsManager } from '../npm/FsManager'
import { Yarn } from '../npm/packageManagers/Yarn'
import { YarnClassic } from '../npm/packageManagers/YarnClassic'
import { Pnpm } from '../npm/packageManagers/Pnpm'
import { Npm } from '../npm/packageManagers/Npm'

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
		private readonly packageWorkspaceResolver: PackageWorkspaceResolver,
	) {}

	public static async get(workspaceDirectory: string) {
		const config = await readWorkspaceConfig({ workspaceDirectory })
		const fsManager = new FsManager()
		const packageWorkspaceResolver = new PackageWorkspaceResolver(fsManager, [
			new Yarn(fsManager),
			new YarnClassic(fsManager),
			new Pnpm(fsManager),
			new Npm(fsManager),
		])

		return new Workspace(workspaceDirectory, readCliEnv(), config, packageWorkspaceResolver)
	}

	get name() {
		return basename(this.directory)
	}

	get adminEnabled(): boolean {
		return this.config?.admin?.enabled || false
	}

	public isSingleProjectMode(): boolean {
		return !!this.env.projectName
	}

	public async resolvePackageWorkspace(): Promise<PackageWorkspace> {
		return await this.packageWorkspaceResolver.resolve(this.directory)
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
