import { workspaceHasAdmin } from '../workspace'
import { join } from 'path'
import { resourcesDir } from '../../pathUtils'
import { installTemplate } from '../template'
import { InstanceLocalEnvironment, resolveInstanceEnvironment } from './enviornment'
import { getInstanceDir, validateInstanceName } from './common'

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
	return await resolveInstanceEnvironment({
		workspaceDirectory: args.workspaceDirectory,
		instanceName: args.instanceName,
	})
}
