import { getWorkspaceApiVersion, workspaceHasAdmin } from '../workspace'
import { join } from 'path'
import { resourcesDir } from '../../pathUtils'
import { installTemplate } from '../template'
import { InstanceLocalEnvironment, resolveInstanceEnvironment } from './enviornment'
import { getInstanceDir, validateInstanceName } from './common'
import { updateMainDockerComposeConfig } from '../dockerCompose'

export const createInstance = async (args: {
	workspaceDirectory: string
	instanceName: string
	template?: string
}): Promise<InstanceLocalEnvironment> => {
	validateInstanceName(args.instanceName)
	const withAdmin = await workspaceHasAdmin(args)
	const template =
		args.template ||
		(withAdmin ? '@contember/template-instance-with-admin' : join(resourcesDir, 'templates/template-instance'))
	const instanceDir = getInstanceDir(args)
	await installTemplate(template, instanceDir, 'instance')
	const version = await getWorkspaceApiVersion({ workspaceDirectory: args.workspaceDirectory })
	await updateMainDockerComposeConfig(instanceDir, (config: any) => ({
		...config,
		services: {
			...config.services,
			api: {
				...config.services.api,
				image: 'contember/contember:' + (version || 'latest'),
			},
		},
	}))
	return await resolveInstanceEnvironment({
		workspaceDirectory: args.workspaceDirectory,
		instanceName: args.instanceName,
	})
}
