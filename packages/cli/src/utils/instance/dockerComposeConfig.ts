import { PortMapping } from '../docker'
import { getConfiguredPortsMap, readDefaultDockerComposeConfig, updateOverrideConfig } from '../dockerCompose'
import getPort from 'get-port'
import { readYaml } from '../yaml'
import { join } from 'path'
import { getProjectDockerEnv } from '../project'
import { promises as fs } from 'fs'
import { resourcesDir } from '../../pathUtils'
import { instanceDirectoryToName } from './common'
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

export const resolveInstanceDockerConfig = async ({
	instanceDirectory,
	host,
	savePortsMapping,
	startPort,
}: {
	instanceDirectory: string
	host?: string[]
	savePortsMapping?: boolean
	startPort?: number
}): Promise<{ composeConfig: any; portsMapping: ServicePortsMapping }> => {
	const instanceName = instanceDirectoryToName(instanceDirectory)

	let config = await readDefaultDockerComposeConfig(instanceDirectory)
	if (!config.services) {
		throw 'docker-compose is not configured'
	}

	const portMapping = await resolvePortsMapping({ instanceDirectory, config, host, startPort })
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
	config = updateConfigWithPorts(config, portMapping)
	if (savePortsMapping) {
		await updateOverrideConfig(instanceDirectory, config => updateConfigWithPorts(config, portMapping))
	}
	if (!config.services.api.user) {
		config.services.api.user = String(process.getuid())
	}

	if (config.services.admin) {
		if (!config.services.admin.environment) {
			config.services.admin.environment = {}
		}
		if (portMapping.admin[0].containerPort) {
			config.services.admin.environment.CONTEMBER_PORT = portMapping.admin[0].containerPort
		}
		config.services.admin.environment.CONTEMBER_INSTANCE = instanceName
		const apiServer = `http://127.0.0.1:${portMapping.api[0].hostPort}`
		if (!config.services.admin.environment.CONTEMBER_API_SERVER) {
			config.services.admin.environment.CONTEMBER_API_SERVER = apiServer
		}
		if (!config.services.admin.user) {
			config.services.admin.user = String(process.getuid())
		}
	}

	const projectConfig: any = await readYaml(join(instanceDirectory, 'api/config.yaml'))
	const s3Endpoint = 'http://localhost:' + portMapping.s3[0].hostPort
	const env: Record<string, string> = {
		SERVER_PORT: '4000',
		TENANT_DB_NAME: 'tenant',
		DEFAULT_DB_HOST: 'db',
		DEFAULT_DB_PORT: '5432',
		DEFAULT_DB_USER: 'contember',
		DEFAULT_DB_PASSWORD: 'contember',
		DEFAULT_S3_BUCKET: 'contember',
		DEFAULT_S3_REGION: '',
		DEFAULT_S3_ENDPOINT: s3Endpoint,
		DEFAULT_S3_KEY: 'contember',
		DEFAULT_S3_SECRET: 'contember',
		DEFAULT_S3_PROVIDER: 'minio',
		TENANT_MAILER_HOST: 'mailhog',
		TENANT_MAILER_PORT: '1025',
		TENANT_MAILER_FROM: 'contember@localhost',
		...Object.keys(projectConfig.projects)
			.map((slug: string): Record<string, string> => getProjectDockerEnv(slug))
			.reduce((acc: Record<string, string>, it: Record<string, string>) => ({ ...acc, ...it }), {}),
	}
	config.services.api.environment = {
		...env,
		...config.services.api.environment,
	}
	config.services.s3.entrypoint = 'sh'

	const bucketPolicy = await fs.readFile(join(resourcesDir, '/s3/policy.json'), { encoding: 'utf8' })
	config.services.s3.command = `-c 'mkdir -p /data/contember && \\
mkdir -p /data/.minio.sys/buckets/contember && \\
echo "${bucketPolicy.replace(/"/g, '\\"')}" > /data/.minio.sys/buckets/contember/policy.json && \\
/usr/bin/minio server --address :${portMapping.s3[0].containerPort} /data'`

	return { composeConfig: config, portsMapping: portMapping }
}
