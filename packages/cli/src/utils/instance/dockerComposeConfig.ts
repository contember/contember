import { PortMapping } from '../docker'
import { DockerComposeConfig, getConfiguredPortsMap } from '../dockerCompose'
import getPort from 'get-port'

type ServicePortsMapping = Record<string, PortMapping[]>

export const resolvePortsMapping = async (args: {
	instanceDirectory: string
	config: DockerComposeConfig
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

const filterUndefinedEntries = (input: Record<string, string | undefined>): Record<string, string> =>
	Object.fromEntries(Object.entries(input).filter((item): item is [string, string] => item[1] !== undefined))

export const patchInstanceOverrideCredentials = (
	config: DockerComposeConfig,
	tenantCredentials: TenantCredentials,
): DockerComposeConfig => {
	if (config.services?.admin) {
		config = {
			...config,
			services: {
				...config.services,
				admin: {
					...config.services.admin,
					environment: filterUndefinedEntries({
						...config.services.admin.environment,
						CONTEMBER_LOGIN_TOKEN: tenantCredentials.loginToken,
					}),
				},
			},
		}
	}
	return {
		...config,
		services: {
			...config.services,
			api: {
				...config.services?.api,
				environment: filterUndefinedEntries({
					...config.services?.api?.environment,
					CONTEMBER_LOGIN_TOKEN: tenantCredentials.loginToken,
					CONTEMBER_ROOT_TOKEN: tenantCredentials.rootToken,
					CONTEMBER_ROOT_EMAIL: tenantCredentials.rootEmail,
					CONTEMBER_ROOT_PASSWORD: tenantCredentials.rootPassword,
				}),
			},
		},
	}
}

export const patchInstanceOverrideConfig = (
	config: DockerComposeConfig,
	portsMapping: ServicePortsMapping,
	version?: string,
) => {
	config = updateConfigWithPorts(config, portsMapping)
	if (config.services?.admin) {
		config = {
			...config,
			services: {
				...config.services,
				admin: {
					...config.services.admin,
					...(!config.services.admin.user && process.getuid
						? {
								user: String(process.getuid()),
						  }
						: {}),
					environment: {
						...config.services.admin.environment,
						CONTEMBER_PORT: String(
							portsMapping.admin[0]?.containerPort || config.services.admin.environment?.CONTEMBER_PORT || '',
						),
						CONTEMBER_API_SERVER: `http://127.0.0.1:${portsMapping.api[0].hostPort}`,
					},
				},
			},
		}
	}

	return {
		...config,
		version: config.version || version || '3.7',
		services: {
			...config.services,
			api: {
				...config.services?.api,
				...(!config.services?.api.user && process.getuid
					? {
							user: String(process.getuid()),
					  }
					: {}),
				environment: {
					...config.services?.api?.environment,
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

type TenantCredentials = {
	rootEmail?: string
	rootPassword?: string
	rootToken?: string
	loginToken?: string
}
