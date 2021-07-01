import { DockerComposeConfig, updateOverrideConfig } from '../dockerCompose'
import { patchInstanceOverrideConfig, resolvePortsMapping } from './dockerComposeConfig'
import { Workspace } from '../Workspace'

export const interactiveInstanceConfigure = async ({
	composeConfig,
	host,
	ports,
	workspace,
}: {
	workspace: Workspace
	composeConfig: DockerComposeConfig
	host?: string[]
	ports?: number
}): Promise<{ adminEnv: Record<string, string> }> => {
	const withAdmin = !!composeConfig.services?.admin
	const adminEnv = !withAdmin ? {} : { ...composeConfig.services?.admin.environment }

	if (!composeConfig.services?.api?.ports) {
		const portsMapping = await resolvePortsMapping({
			instanceDirectory: workspace.directory,
			config: composeConfig,
			host: host,
			startPort: ports,
		})
		await updateOverrideConfig(workspace.directory, config =>
			patchInstanceOverrideConfig(config, portsMapping, composeConfig.version),
		)
	}

	return { adminEnv }
}
