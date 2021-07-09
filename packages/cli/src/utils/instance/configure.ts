import { DockerComposeConfig, updateOverrideConfig, Workspace } from '@contember/cli-common'
import { patchInstanceOverrideConfig, resolvePortsMapping } from './dockerComposeConfig'

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
	const apiServiceName = composeConfig.services?.['contember'] ? 'contember' : 'api'
	if (!composeConfig.services?.[apiServiceName]?.ports) {
		const portsMapping = await resolvePortsMapping({
			instanceDirectory: workspace.directory,
			config: composeConfig,
			host: host,
			startPort: ports,
		})
		await updateOverrideConfig(workspace.directory, config =>
			patchInstanceOverrideConfig(config, portsMapping, composeConfig),
		)
	}

	return { adminEnv }
}
