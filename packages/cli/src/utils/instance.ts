import { basename, join } from 'path'
import { listDirectories } from './fs'
import { copy, pathExists } from 'fs-extra'

import { resourcesDir } from '../pathUtils'
import { execDockerCompose, hasConfiguredPorts, readDefaultDockerComposeConfig } from './dockerCompose'
import { runCommand } from './commands'
import getPort from 'get-port'
import { Input } from '../cli/Input'
import { readYaml } from './yaml'
import { getProjectDockerEnv } from './project'
import { promises as fs } from 'fs'

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
	await copy(join(resourcesDir, './instance-template'), getInstanceDir(args))
	return await resolveInstanceEnvironment({
		workspaceDirectory: args.workspaceDirectory,
		instanceName: args.instanceName,
	})
}

export interface ServiceStatus {
	name: string
	status: string
	running: boolean
	ports: {
		containerPort: number
		hostIp: string
		hostPort: number
	}[]
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

export const resolveInstanceDockerConfig = async ({
	instanceDirectory,
}: {
	instanceDirectory: string
}): Promise<any> => {
	const instanceName = instanceDirectoryToName(instanceDirectory)

	let config = await readDefaultDockerComposeConfig(instanceDirectory)
	if (!config.services) {
		throw new Error('docker-compose is not configured')
	}

	const runningServices = await getInstanceStatus({ instanceDirectory })

	const exposedServices = [
		{ service: 'admin', port: null },
		{ service: 'api', port: 4000 },
		{ service: 'db', port: 5432 },
		{ service: 's3', port: null },
		{ service: 'adminer', port: 8080 },
	]
	const assignedPorts: Record<string, number> = {}
	let assignedPort = 1023
	for (const { service, port: internalPort } of exposedServices) {
		if (!hasConfiguredPorts(config, service)) {
			const runningStatus = runningServices.find(it => it.name === service)
			const runningPortMapping =
				runningStatus && runningStatus.ports.find(it => !internalPort || it.containerPort === internalPort)
			assignedPort = runningPortMapping
				? runningPortMapping.hostPort
				: await getPort({ port: getPort.makeRange(assignedPort + 1, 65535) })
			assignedPorts[service] = assignedPort
			config.services[service].ports = [`127.0.0.1:${assignedPort}:${internalPort || assignedPort}`]
		}
	}
	if (!config.services.admin.environment) {
		config.services.admin.environment = {}
	}
	if (assignedPorts.admin) {
		config.services.admin.environment.CONTEMBER_PORT = assignedPorts.admin
	}
	config.services.admin.environment.CONTEMBER_INSTANCE = instanceName
	const apiServer = `http://127.0.0.1:${assignedPorts.api}`
	if (!config.services.admin.environment.CONTEMBER_API_SERVER && assignedPorts.api) {
		config.services.admin.environment.CONTEMBER_API_SERVER = apiServer
	}
	if (!config.services.admin.user) {
		config.services.admin.user = String(process.getuid())
	}
	if (!config.services.api.user) {
		config.services.api.user = String(process.getuid())
	}

	const projectConfig: any = await readYaml(join(instanceDirectory, 'api/config.yaml'))
	const s3Endpoint = 'http://localhost:' + assignedPorts.s3
	const env: Record<string, string> = {
		SERVER_PORT: 4000,
		TENANT_DB_HOST: 'db',
		TENANT_DB_PORT: '5432',
		TENANT_DB_USER: 'contember',
		TENANT_DB_PASSWORD: 'contember',
		TENANT_DB_NAME: 'tenant',
		DB_HOST: 'db',
		DB_PORT: '5432',
		DB_USER: 'contember',
		DB_PASSWORD: 'contember',
		DB_NAME: 'contember',
		S3_BUCKET: 'contember',
		S3_PREFIX: '',
		S3_REGION: '',
		S3_ENDPOINT: s3Endpoint,
		S3_KEY: 'contember',
		S3_SECRET: 'contember',
		...projectConfig.projects
			.map((project: any): Record<string, string> => getProjectDockerEnv(project.slug, s3Endpoint))
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
/usr/bin/minio server --address :${assignedPorts.s3} /data'`

	return config
}
