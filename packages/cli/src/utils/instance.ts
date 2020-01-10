import { basename, join } from 'path'
import { listDirectories, replaceFileContent, tryUnlink } from './fs'
import { copy, pathExists } from 'fs-extra'

import { resourcesDir } from '../pathUtils'
import {
	execDockerCompose,
	getConfiguredPorts,
	getConfiguredPortsMap,
	readDefaultDockerComposeConfig,
	updateOverrideConfig,
} from './dockerCompose'
import { runCommand } from './commands'
import getPort from 'get-port'
import { Input } from '../cli/Input'
import { JsonUpdateCallback, readMultipleYaml, readYaml, updateYaml } from './yaml'
import { getProjectDockerEnv } from './project'
import { promises as fs } from 'fs'
import { hasInstanceAdmin } from './workspace'
import { installTemplate } from './template'

export const validateInstanceName = (name: string) => {
	if (!name.match(/^[a-z][a-z0-9]*$/)) {
		throw new Error('Invalid instance name. It can contain only alphanumeric letters and cannot start with a number')
	}
}

export const listInstances = async (args: { workspaceDirectory: string }) => {
	return (await listDirectories(join(args.workspaceDirectory, 'instances'))).map(it => basename(it))
}

export const getDefaultInstance = async ({ workspaceDirectory }: { workspaceDirectory: string }): Promise<string> => {
	const instances = await listInstances({ workspaceDirectory })
	if (instances.length > 1) {
		throw new Error('Please specify an instance')
	}
	return instances[0]
}

export const getInstanceDir = (args: { workspaceDirectory: string; instanceName: string }): string =>
	join(args.workspaceDirectory, 'instances', args.instanceName)

export const createInstance = async (args: {
	workspaceDirectory: string
	instanceName: string
}): Promise<InstanceEnvironment> => {
	validateInstanceName(args.instanceName)
	const withAdmin = await hasInstanceAdmin(args)
	const template = join(resourcesDir, 'templates', withAdmin ? 'template-instance-with-admin' : 'template-instance')
	const instanceDir = getInstanceDir(args)
	await installTemplate(template, instanceDir, 'instance')
	return await resolveInstanceEnvironment({
		workspaceDirectory: args.workspaceDirectory,
		instanceName: args.instanceName,
	})
}

export interface ServiceStatus {
	name: string
	status: string
	running: boolean
	ports: PortMapping[]
}

const instanceDirectoryToName = (instanceDirectory: string) =>
	basename(instanceDirectory)
		.toLocaleLowerCase()
		.replace(/[^-_a-z0-9]/, '')
export const getInstanceStatus = async ({
	instanceDirectory,
}: {
	instanceDirectory: string
}): Promise<ServiceStatus[]> => {
	const instanceName = instanceDirectoryToName(instanceDirectory)
	const runningContainers = (await execDockerCompose(['ps', '-q'], { cwd: instanceDirectory, stdout: false }))
		.split('\n')
		.filter(it => it.length > 0)

	if (runningContainers.length === 0) {
		return []
	}

	const containerInfo = JSON.parse(
		await runCommand('docker', ['inspect', ...runningContainers], { cwd: instanceDirectory }).output,
	)
	const statusList: ServiceStatus[] = []
	for (const container of containerInfo) {
		const containerName = String(container.Name)
		if (!containerName.startsWith('/' + instanceName + '_')) {
			continue
		}
		const serviceName = containerName.substring(instanceName.length + 2, containerName.lastIndexOf('_'))

		const status = container.State.Status
		const running = container.State.Running
		statusList.push({
			name: serviceName,
			running,
			status,
			ports: parsePortMapping(container.NetworkSettings.Ports),
		})
	}
	return statusList
}

interface PortMapping {
	containerPort: number
	hostIp: string
	hostPort: number
}

export const printInstanceStatus = async (args: { instanceDirectory: string }) => {
	const statusList = await getInstanceStatus(args)
	if (statusList.length === 0) {
		console.log('There is no running service.')
		return
	}
	console.log('Following services are running:')
	statusList.forEach(it => {
		const addressStr = it.ports.map(it => `http://${it.hostIp}:${it.hostPort}`)

		const addressInfo = it.running && addressStr.length > 0 ? ` on ${addressStr}` : ''
		console.log(`${it.name}: ${it.status}${addressInfo}`)
	})
}

const parsePortMapping = (
	portsOutput: Record<string, null | Array<{ HostIp: string; HostPort: number }>>,
): PortMapping[] => {
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

export const resolveInstanceEnvironment = async (args: {
	workspaceDirectory: string
	instanceName: string
}): Promise<InstanceEnvironment> => {
	validateInstanceName(args.instanceName)
	const instanceDirectory = getInstanceDir(args)
	await verifyInstanceExists({ instanceDirectory, instanceName: args.instanceName })
	return { instanceName: args.instanceName, instanceDirectory }
}

export const resolveInstanceListEnvironmentFromInput = async ({
	input,
	workspaceDirectory,
}: {
	workspaceDirectory: string
	input: Input<
		{},
		{
			['all-instances']: boolean
			['no-instance']: boolean
			['instance']: string[]
		}
	>
}): Promise<InstanceEnvironment[]> => {
	let instances: string[]
	if (input.getOption('no-instance')) {
		instances = []
	} else if (input.getOption('instance')) {
		instances = input.getOption('instance')
	} else if (input.getOption('all-instances')) {
		instances = await listInstances({ workspaceDirectory })
	} else if (process.env.CONTEMBER_INSTANCE) {
		instances = [process.env.CONTEMBER_INSTANCE]
	} else {
		instances = [await getDefaultInstance({ workspaceDirectory })]
	}
	return await Promise.all(
		instances.map(
			(instanceName): Promise<InstanceEnvironment> => resolveInstanceEnvironment({ instanceName, workspaceDirectory }),
		),
	)
}

export interface InstanceEnvironment {
	instanceDirectory: string
	instanceName: string
}
export const resolveInstanceEnvironmentFromInput = async (
	inputCommand: Input<{
		instanceName?: string
	}>,
): Promise<InstanceEnvironment> => {
	const workspaceDirectory = process.cwd()
	let [instanceName] = [
		inputCommand.getArgument('instanceName') ||
			process.env.CONTEMBER_INSTANCE ||
			(await getDefaultInstance({ workspaceDirectory })),
	]
	return await resolveInstanceEnvironment({ workspaceDirectory, instanceName })
}

const verifyInstanceExists = async ({
	instanceDirectory,
	instanceName,
}: {
	instanceDirectory: string
	instanceName: string
}) => {
	if (!(await pathExists(instanceDirectory))) {
		throw new Error(`Instance ${instanceName} not found.`)
	}
}

type ServicePortsMapping = Record<string, PortMapping[]>

export const resolvePortsMapping = async (args: {
	instanceDirectory: string
	config: any
	startPort?: number
	host?: string
}): Promise<ServicePortsMapping> => {
	const exposedServices = [
		{ service: 'admin', port: null },
		{ service: 'api', port: 4000 },
		{ service: 'db', port: 5432 },
		{ service: 's3', port: null },
		{ service: 'adminer', port: 8080 },
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
		const configuredPortMapping = serviceConfiguredPorts.find(
			it => !containerPort || it.containerPort === containerPort,
		)
		const otherConfiguredPorts = serviceConfiguredPorts.filter(it => it !== configuredPortMapping)

		const runningStatus = runningServices.find(it => it.name === service)
		const runningPortMapping =
			runningStatus && runningStatus.ports.find(it => !containerPort || it.containerPort === containerPort)

		let assignedPortMapping = configuredPortMapping || runningPortMapping
		if (!assignedPortMapping) {
			let freePort
			do {
				freePort = await getPort({ port: getPort.makeRange(startPort, 65535) })
			} while (occupiedPorts.includes(freePort))

			occupiedPorts.push(freePort)
			assignedPortMapping = {
				containerPort: containerPort || freePort,
				hostPort: freePort,
				hostIp: args.host || '127.0.0.1',
			}
			startPort = freePort + 1
		}

		servicePortMapping[service] = [assignedPortMapping, ...otherConfiguredPorts]
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
	host?: string
	savePortsMapping?: boolean
	startPort?: number
}): Promise<{ composeConfig: any; portsMapping: ServicePortsMapping }> => {
	const instanceName = instanceDirectoryToName(instanceDirectory)

	let config = await readDefaultDockerComposeConfig(instanceDirectory)
	if (!config.services) {
		throw new Error('docker-compose is not configured')
	}

	const portMapping = await resolvePortsMapping({ instanceDirectory, config, host, startPort })
	const updateConfigWithPorts = (config: any, portsMapping: ServicePortsMapping): any => {
		const result = Object.entries(portsMapping).reduce(
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
		return result
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

const INSTANCE_LOCAL_FILE = 'contember.instance.local.yaml'

export interface InstanceConfig {
	loginToken?: string
}

export const readInstanceConfig = async (args: { instanceDirectory: string }): Promise<InstanceConfig> => {
	const paths = ['contember.instance.yaml', INSTANCE_LOCAL_FILE].map(it => join(args.instanceDirectory, it))
	return await readMultipleYaml(paths)
}

export const updateInstanceLocalConfig = async (args: {
	instanceDirectory: string
	updater: JsonUpdateCallback
}): Promise<void> => {
	const path = join(args.instanceDirectory, INSTANCE_LOCAL_FILE)
	return updateYaml(path, args.updater, { createMissing: true })
}
