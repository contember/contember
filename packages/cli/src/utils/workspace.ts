import { pathExists, formatWorkspaceConfigPath, Workspace } from '@contember/cli-common'
import { updateYaml } from './yaml'

export const updateWorkspaceApiVersion = async (workspace: Workspace, newVersion: string): Promise<string | null> => {
	const possiblePaths = formatWorkspaceConfigPath(workspace.directory)
	for (const configPath of possiblePaths) {
		if (await pathExists(configPath)) {
			await updateYaml(configPath, data => {
				return {
					...data,
					api: {
						...(typeof data.api === 'object' ? data.api : {}),
						version: newVersion,
					},
				}
			})
			return configPath.slice(workspace.directory.length)
		}
	}
	return null
}
