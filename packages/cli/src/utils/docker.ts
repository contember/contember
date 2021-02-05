import { runCommand } from './commands'

type DockerNetworkPorts = Record<string, null | Array<{ HostIp: string; HostPort: number }>>

export interface PortMapping {
	containerPort: number
	hostIp: string
	hostPort: number
}

const parsePortMapping = (portsOutput: DockerNetworkPorts): PortMapping[] => {
	return Object.entries(portsOutput)
		.filter((it): it is [string, Array<{ HostIp: string; HostPort: number }>] => !!it[1])
		.reduce<PortMapping[]>(
			(acc, [containerPort, host]) => [
				...acc,
				...host.map(it => ({
					containerPort: Number(containerPort.substr(0, containerPort.indexOf('/'))),
					hostIp: it.HostIp,
					hostPort: Number(it.HostPort),
				})),
			],
			[],
		)
}

export interface ContainerStatus {
	name: string
	status: string
	running: boolean
	ports: PortMapping[]
}

export const getContainersStatus = async ({
	containers,
	cwd,
}: {
	containers: string[]
	cwd: string
}): Promise<ContainerStatus[]> => {
	const containerInfo = JSON.parse(await runCommand('docker', ['inspect', ...containers], { cwd }).output)
	const statusList: ContainerStatus[] = []
	for (const container of containerInfo) {
		const containerName = String(container.Name).substring(1)

		const status = container.State.Status
		const running = container.State.Running
		statusList.push({
			name: containerName,
			running,
			status,
			ports: parsePortMapping(container.NetworkSettings.Ports),
		})
	}
	return statusList
}

export const printContainersStatus = (statusList: ContainerStatus[]) => {
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
