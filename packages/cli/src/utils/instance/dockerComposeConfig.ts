import { PortMapping } from '../docker'
import { getConfiguredPortsMap, readDefaultDockerComposeConfig, updateOverrideConfig } from '../dockerCompose'
import getPort from 'get-port'
import { getInstanceStatus } from './status'

type ServicePortsMapping = Record<string, PortMapping[]>

export const resolvePortsMapping = async (args: {
	instanceDirectory: string
	config: any
	startPort?: number
	host?: string[]
}): Promise<ServicePortsMapping> => {
	const exposedServices = [
		{ service: 'admin', port: null },
		{ service: 'api', port: 4000 },
		{ service: 'db', port: 5432 },
		{ service: 's3', port: null },
		{ service: 'adminer', port: 8080 },
		{ service: 'mailhog', port: 8025 },
	]
	const runningServices = await getInstanceStatus({ instanceDirectory: args.instanceDirectory })

	const configuredPorts = getConfiguredPortsMap(args.config)
	const occupiedPorts = Object.values(configuredPorts).flatMap(it => it.map(it => it.hostPort))
	let startPort = args.startPort || 1480
	const servicePortMapping: ServicePortsMapping = {}
	for (const { service, port: containerPort } of exposedServices) {
		if (!args.config.services[service]) {
			continue
		}
		const serviceConfiguredPorts = configuredPorts[service] || []
		const configuredPortMapping = serviceConfiguredPorts.filter(
			it => !containerPort || it.containerPort === containerPort,
		)
		const otherConfiguredPorts = serviceConfiguredPorts.filter(it => !configuredPortMapping.includes(it))

		const runningStatus = runningServices.find(it => it.name === service)
		const runningPortMapping =
			runningStatus?.ports.filter(it => !containerPort || it.containerPort === containerPort) || []

		let assignedPortMapping = configuredPortMapping.length > 0 ? configuredPortMapping : runningPortMapping
		if (assignedPortMapping.length === 0) {
			let freePort: number
			do {
				freePort = await getPort({ port: getPort.makeRange(startPort++, 65535) })
			} while (occupiedPorts.includes(freePort))

			occupiedPorts.push(freePort)
			assignedPortMapping = (args.host || ['127.0.0.1']).map(host => ({
				containerPort: containerPort || freePort,
				hostPort: freePort,
				hostIp: host,
			}))
		}

		servicePortMapping[service] = [...assignedPortMapping, ...otherConfiguredPorts]
	}
	return servicePortMapping
}

const serializePortMapping = (mapping: PortMapping) => `${mapping.hostIp}:${mapping.hostPort}:${mapping.containerPort}`

const updateConfigWithPorts = (config: any, portsMapping: ServicePortsMapping): any => {
	return Object.entries(portsMapping).reduce(
		(config, [service, mapping]) => ({
			...config,
			services: {
				...config.services,
				[service]: {
					...config.services[service],
					ports: mapping.map(serializePortMapping),
				},
			},
		}),
		config,
	)
}

export const patchInstanceOverrideConfig = (config: any, portsMapping: ServicePortsMapping) => {
	config = updateConfigWithPorts(config, portsMapping)
	if (config.services.admin) {
		config = {
			...config,
			services: {
				...config.services,
				admin: {
					...config.services.admin,
					user: config.services.admin.user || String(process.getuid()),
					environment: {
						...config.services.admin.environment,
						CONTEMBER_PORT: portsMapping.admin[0]?.containerPort || config.services.admin.environment?.CONTEMBER_PORT,
						CONTEMBER_API_SERVER: `http://127.0.0.1:${portsMapping.api[0].hostPort}`,
					},
				},
			},
		}
	}

	return {
		...config,
		version: config.version || '3.7',
		services: {
			...config.services,
			api: {
				...config.services.api,
				user: config.services.api?.user || String(process.getuid()),
				environment: {
					...config.services.api?.environment,
					DEFAULT_S3_ENDPOINT: 'http://localhost:' + portsMapping.s3[0].hostPort,
				},
			},
			s3: {
				...config.services.s3,
				command: `server --address :${portsMapping.s3[0].containerPort} /data`,
			},
		},
	}
}

export const resolveInstanceDockerConfig = async ({
	instanceDirectory,
	host,
	saveConfig,
	startPort,
}: {
	instanceDirectory: string
	host?: string[]
	saveConfig?: boolean
	startPort?: number
}): Promise<{ composeConfig: any; portsMapping: ServicePortsMapping }> => {
	let config = await readDefaultDockerComposeConfig(instanceDirectory)
	if (!config.services) {
		throw 'docker-compose is not configured'
	}

	const portMapping = await resolvePortsMapping({ instanceDirectory, config, host, startPort })
	config = patchInstanceOverrideConfig(config, portMapping)
	if (saveConfig) {
		await updateOverrideConfig(instanceDirectory, config => patchInstanceOverrideConfig(config, portMapping))
	}

	return { composeConfig: config, portsMapping: portMapping }
}

export const updateInstanceOverrideConfig = async ({
	instanceDirectory,
	host,
	startPort,
}: {
	instanceDirectory: string
	host?: string[]
	savePortsMapping?: boolean
	startPort?: number
}): Promise<void> => {
	let config = await readDefaultDockerComposeConfig(instanceDirectory)
	if (!config.services) {
		throw 'docker-compose is not configured'
	}

	const portMapping = await resolvePortsMapping({ instanceDirectory, config, host, startPort })
	await updateOverrideConfig(instanceDirectory, config => patchInstanceOverrideConfig(config, portMapping))
}
