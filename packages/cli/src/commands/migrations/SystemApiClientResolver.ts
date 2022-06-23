import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { interactiveResolveApiToken } from '../../utils/tenant'
import { SystemClient } from '../../utils/system'
import { Workspace, Project, Input } from '@contember/cli-common'

export const resolveSystemApiClient = async (
	workspace: Workspace,
	project: Project,
	input?: Input<
		{},
		{
			instance?: string
			['remote-project']?: string
		}
	>,
): Promise<SystemClient> => {
	const instance = await interactiveResolveInstanceEnvironmentFromInput(workspace, input?.getOption('instance'))
	const apiToken = await interactiveResolveApiToken({ workspace, instance })
	const remoteProject = input?.getOption('remote-project') || project.name
	return SystemClient.create(instance.baseUrl, remoteProject, apiToken)
}
