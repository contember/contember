import { ContainerStatus, getContainersStatus } from '../docker'
import { execDockerCompose } from '../dockerCompose'
import { Workspace } from '../Workspace'

export type ServiceStatus = ContainerStatus

export const getServicesStatus = async (workspace: Workspace): Promise<ServiceStatus[]> => {
	const instanceName = process.env.COMPOSE_PROJECT_NAME || workspace.name
	const runningContainers = (
		await execDockerCompose(['ps', '-q'], {
			cwd: workspace.directory,
			stdout: false,
		})
	)
		.split('\n')
		.filter(it => it.length > 0)

	if (runningContainers.length === 0) {
		return []
	}

	return (await getContainersStatus({ containers: runningContainers, cwd: workspace.directory }))
		.filter(it => it.name.startsWith(instanceName + '_'))
		.map(it => ({ ...it, name: it.name.substring(instanceName.length + 1, it.name.lastIndexOf('_')) }))
}
