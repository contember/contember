import { ContainerStatus, getContainersStatus } from '../docker'
import { execDockerCompose } from '../dockerCompose'
import { Instance } from '../Instance'

export type ServiceStatus = ContainerStatus

export const getInstanceStatus = async (instance: Instance): Promise<ServiceStatus[]> => {
	const instanceName = process.env.COMPOSE_PROJECT_NAME || instance.name
	const runningContainers = (
		await execDockerCompose(['ps', '-q'], {
			cwd: instance.directory,
			stdout: false,
		})
	)
		.split('\n')
		.filter(it => it.length > 0)

	if (runningContainers.length === 0) {
		return []
	}

	return (await getContainersStatus({ containers: runningContainers, cwd: instance.directory }))
		.filter(it => it.name.startsWith(instanceName + '_'))
		.map(it => ({ ...it, name: it.name.substring(instanceName.length + 1, it.name.lastIndexOf('_')) }))
}
