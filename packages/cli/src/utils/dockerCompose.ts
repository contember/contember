import { pathExists } from 'fs-extra'
import { join } from 'path'
import { runCommand, RunningCommand } from './commands'
import { Readable, Writable } from 'stream'
import { JsonUpdateCallback, readMultipleYaml, updateYaml } from './yaml'
import { dump } from 'js-yaml'
import { tuple } from './tuple'

const OVERRIDE_CONFIGS = ['docker-compose.override.yaml', 'docker-compose.override.yml']
const MAIN_CONFIGS = ['docker-compose.yaml', 'docker-compose.yml']

export const updateOverrideConfig = async (dir: string, updater: JsonUpdateCallback): Promise<void> => {
	let overridePath = join(dir, 'docker-compose.override.yaml')
	for (const file of OVERRIDE_CONFIGS) {
		const path = join(dir, file)
		if (await pathExists(path)) {
			overridePath = path
			break
		}
	}
	return updateYaml(overridePath, updater, { createMissing: true })
}

export const readDefaultDockerComposeConfig = async (dir: string): Promise<any> => {
	const candidates = [...MAIN_CONFIGS, ...OVERRIDE_CONFIGS]

	return await readMultipleYaml(candidates.map(it => join(dir, it)))
}

export type PortsMapping = {
	containerPort: number
	hostPort: number
	hostIp: string
}

export const getConfiguredPortsMap = (config: DockerComposeConfig): Record<string, PortsMapping[]> => {
	return Object.fromEntries(
		Object.keys(config.services || {}).map(service => tuple(service, getConfiguredPorts(config, service))),
	)
}

export const getConfiguredPorts = (config: DockerComposeConfig, service: string): PortsMapping[] => {
	const ports = config?.services?.[service]?.ports
	if (!ports || !Array.isArray(ports) || ports.length === 0) {
		return []
	}
	return ports
		.map((it): PortsMapping | null => {
			if (typeof it !== 'string') {
				console.warn('Ports mapping in long syntax is not supported')
				return null
			}
			const result = it.match(/^(?:(?:(?<host>\d+\.\d+\.\d+\.\d+):)?(?:(?<published>\d+):))?(?<target>\d+)$/)
			if (!result || !result.groups) {
				console.warn(`Ports mapping "${it} not recognized`)
				return null
			}
			return {
				containerPort: Number(result.groups.target),
				hostPort: Number(result.groups.published || result.groups.target),
				hostIp: result.groups.host || '0.0.0.0',
			}
		})
		.filter((it): it is PortsMapping => it !== null)
}

export type DockerComposeRunOptions = {
	cwd: string
	stdin?: string
	stdout?: Writable | false
	env?: NodeJS.ProcessEnv
	detached?: boolean
}
export const execDockerCompose = async (args: string[], options: DockerComposeRunOptions): Promise<string> => {
	return await runDockerCompose(args, options).output
}

export const runDockerCompose = (args: string[], options: DockerComposeRunOptions): RunningCommand => {
	const input = new Readable()
	const command = runCommand('docker-compose', args, {
		cwd: options.cwd,
		stdout: options.stdout === false ? undefined : options.stdout || process.stdout,
		stderr: process.stderr,
		stdin: input,
		env: {
			// todo
			CONTEMBER_VERSION: '0',
		},
		detached: options.detached,
	})
	input.push(options.stdin)
	input.push(null)
	return command
}

interface DockerComposeServiceConfig {
	environment: Record<string, string>
	ports: (string | {})[] // todo long syntax
}

interface DockerComposeConfig {
	services: Record<string, DockerComposeServiceConfig>
}

export class DockerCompose {
	private configYamlCache: string | null = null

	get configYaml(): string {
		if (this.configYamlCache === null) {
			this.configYamlCache = dump(this.config)
		}
		return this.configYamlCache
	}

	constructor(private readonly cwd: string, public readonly config: DockerComposeConfig) {}

	run(args: string[]): RunningCommand {
		return runDockerCompose(['-f', '-', ...args], {
			cwd: this.cwd,
			stdin: this.configYaml,
		})
	}

	public withConfig(config: DockerComposeConfig): DockerCompose {
		return new DockerCompose(this.cwd, config)
	}

	public withService(service: string, serviceConfig: DockerComposeServiceConfig): DockerCompose {
		return this.withConfig({ ...this.config, services: { ...this.config.services, [service]: serviceConfig } })
	}
}
