import { ContainerStatus, getContainersStatus } from '../docker'
import { execDockerCompose } from '../dockerCompose'
import { InstanceLocalEnvironment } from './environment'

export type ServiceStatus = ContainerStatus

export const getInstanceStatus = async ({
	instanceDirectory,
	instanceName,
}: InstanceLocalEnvironment): Promise<ServiceStatus[]> => {
	instanceName = process.env.COMPOSE_PROJECT_NAME || instanceName
	const runningContainers = (
		await execDockerCompose(['ps', '-q'], {
			cwd: instanceDirectory,
			stdout: false,
		})
	)
		.split('\n')
		.filter(it => it.length > 0)

	if (runningContainers.length === 0) {
		return []
	}

	return (await getContainersStatus({ containers: runningContainers, cwd: instanceDirectory }))
		.filter(it => it.name.startsWith(instanceName + '_'))
		.map(it => ({ ...it, name: it.name.substring(instanceName.length + 1, it.name.lastIndexOf('_')) }))
}

export const printInstanceStatus = async (args: InstanceLocalEnvironment) => {
	const statusList = await getInstanceStatus(args)
	if (statusList.length === 0) {
		console.log('There is no running service.')
		return
	}
	console.log('Following services are running:')
	statusList.forEach(it => {
		const addressStr = it.ports.map(it => `http://${it.hostIp}:${it.hostPort}`).join(' ')

		const addressInfo = it.running && addressStr.length > 0 ? ` on ${addressStr}` : ''
		console.log(`${it.name}: ${it.status}${addressInfo}`)
	})
}
