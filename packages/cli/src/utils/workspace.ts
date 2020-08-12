import { pathExists } from 'fs-extra'
import { join } from 'path'
import { createInstance } from './instance'
import { createProject, registerProjectToInstance } from './project'
import { readYaml, updateYaml } from './yaml'
import { installTemplate } from './template'
import { resourcesDir } from '../pathUtils'

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

	const instance = await createInstance({ workspaceDirectory, instanceName: 'default' })
	await createProject({ workspaceDirectory, projectName: 'sandbox' })
	await registerProjectToInstance({ projectName: 'sandbox', ...instance })
}

export interface WorkspaceConfig {
	api?: {
		version?: string
	}
	admin?: {
		enabled?: boolean
	}
}

const formatConfigPath = (workspaceDirectory: string) => join(workspaceDirectory, 'contember.workspace.yaml')

export const readWorkspaceConfig = async ({
	workspaceDirectory,
}: WorkspaceDirectoryArgument): Promise<WorkspaceConfig> => {
	const configPath = formatConfigPath(workspaceDirectory)
	if (!(await pathExists(configPath))) {
		return {}
	}
	return await readYaml(configPath)
}

export const workspaceHasAdmin = async ({ workspaceDirectory }: WorkspaceDirectoryArgument): Promise<boolean> => {
	const workspaceConfig = await readWorkspaceConfig({ workspaceDirectory })
	return workspaceConfig?.admin?.enabled || false
}

export const getWorkspaceApiVersion = async ({
	workspaceDirectory,
}: WorkspaceDirectoryArgument): Promise<string | undefined> => {
	const workspaceConfig = await readWorkspaceConfig({ workspaceDirectory })
	return workspaceConfig?.api?.version || undefined
}

export const updateWorkspaceApiVersion = async ({
	workspaceDirectory,
	version,
}: WorkspaceDirectoryArgument & { version: string }) => {
	const configPath = formatConfigPath(workspaceDirectory)
	if (!(await pathExists(configPath))) {
		return false
	}
	await updateYaml(configPath, data => {
		return {
			...data,
			api: {
				...(typeof data.api === 'object' ? data.api : {}),
				version,
			},
		}
	})
	return true
}
