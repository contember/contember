import { PortMapping } from '../docker'
import { getConfiguredPortsMap } from '../dockerCompose'
import { DockerComposeConfig } from '@contember/cli-common'
import getPort from 'get-port'

type ServicePortsMapping = Record<string, PortMapping[]>

export const resolvePortsMapping = async (args: {
	instanceDirectory: string
	config: DockerComposeConfig
	startPort?: number
	host?: string[]
}): Promise<ServicePortsMapping> => {
	const exposedServices = [
		{ service: 'contember-admin', port: null },
		{ service: 'contember', port: 4000 },
		{ service: 'postgresql', port: 5432 },
		{ service: 's3', port: null },
		{ service: 'adminer', port: 8080 },
		{ service: 'mailhog', port: 8025 },
		// deprecated
		{ service: 'admin', port: null },
		{ service: 'api', port: 4000 },
		{ service: 'db', port: 5432 },
	]

	const configuredPorts = getConfiguredPortsMap(args.config)
	const occupiedPorts = Object.values(configuredPorts).flatMap(it => it.map(it => it.hostPort))
	let startPort = args.startPort || 1480
	const servicePortMapping: ServicePortsMapping = {}
	for (const { service, port: containerPort } of exposedServices) {
		if (!args.config.services?.[service]) {
			continue
		}
		const serviceConfiguredPorts = configuredPorts[service] || []
		const configuredPortMapping = serviceConfiguredPorts.filter(
			it => !containerPort || it.containerPort === containerPort,
		)
		const otherConfiguredPorts = serviceConfiguredPorts.filter(it => !configuredPortMapping.includes(it))

		let assignedPortMapping = configuredPortMapping.length > 0 ? configuredPortMapping : []
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
					...(config.services || {})[service],
					ports: mapping.map(serializePortMapping),
				},
			},
		}),
		config,
	)
}

export const patchInstanceOverrideConfig = (
	config: DockerComposeConfig,
	portsMapping: ServicePortsMapping,
	mainConfig: DockerComposeConfig,
) => {
	const apiServiceName = mainConfig.services?.['contember'] ? 'contember' : 'api'
	const adminServiceName = mainConfig.services?.['contember-admin'] ? 'contember-admin' : 'admin'
	config = updateConfigWithPorts(config, portsMapping)
	if (config.services?.[adminServiceName]) {
		config = {
			...config,
			services: {
				...config.services,
				[adminServiceName]: {
					...config.services[adminServiceName],
					...(!config.services[adminServiceName].user && process.getuid
						? {
								user: String(process.getuid()),
						  }
						: {}),
					environment: {
						...config.services[adminServiceName].environment,
						CONTEMBER_PORT: String(
							portsMapping[adminServiceName][0]?.containerPort ||
								config.services[adminServiceName].environment?.CONTEMBER_PORT ||
								'',
						),
						CONTEMBER_API_SERVER: `http://127.0.0.1:${portsMapping[apiServiceName][0].hostPort}`,
					},
				},
			},
		}
	}

	return {
		...config,
		version: config.version || mainConfig.version || '3.7',
		services: {
			...config.services,
			[apiServiceName]: {
				...config.services?.[apiServiceName],
				...(!config.services?.[apiServiceName]?.user && process.getuid
					? {
							user: String(process.getuid()),
					  }
					: {}),
				environment: {
					...config.services?.[apiServiceName]?.environment,
					DEFAULT_S3_ENDPOINT: 'http://localhost:' + portsMapping.s3[0].hostPort,
				},
			},
			s3: {
				...config.services?.s3,
				command: `server --address :${portsMapping.s3[0].containerPort} /data`,
			},
		},
	}
}
