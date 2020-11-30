import { pathExists } from 'fs-extra'
import { join } from 'path'
import { runCommand, RunningCommand } from './commands'
import { Readable, Writable } from 'stream'
import { JsonUpdateCallback, readMultipleYaml, updateYaml } from './yaml'
import { tuple } from './tuple'

const OVERRIDE_CONFIGS = ['docker-compose.override.yaml', 'docker-compose.override.yml']
const MAIN_CONFIGS = ['docker-compose.yaml', 'docker-compose.yml']

const resolvePath = async (dir: string, possibleFileNames: string[], fallbackFileName: string): Promise<string> => {
	for (const file of possibleFileNames) {
		const path = join(dir, file)
		if (await pathExists(path)) {
			return path
		}
	}
	return join(dir, fallbackFileName)
}

export const updateOverrideConfig = async (dir: string, updater: JsonUpdateCallback): Promise<void> => {
	const path = process.env.COMPOSE_FILE || (await resolvePath(dir, OVERRIDE_CONFIGS, OVERRIDE_CONFIGS[0]))
	return updateYaml(path, updater, { createMissing: true })
}

export const updateMainDockerComposeConfig = async (
	dir: string,
	updater: JsonUpdateCallback<DockerComposeConfig>,
): Promise<void> => {
	const path = process.env.COMPOSE_FILE || (await resolvePath(dir, MAIN_CONFIGS, MAIN_CONFIGS[0]))
	return updateYaml(path, updater, { createMissing: true })
}

export const readDefaultDockerComposeConfig = async (dir: string): Promise<any> => {
	const candidates = process.env.COMPOSE_FILE ? [process.env.COMPOSE_FILE] : [...MAIN_CONFIGS, ...OVERRIDE_CONFIGS]

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
			...options.env,
		},
		detached: options.detached,
	})
	input.push(options.stdin)
	input.push(null)
	return command
}

export interface DockerComposeServiceConfig {
	image?: string
	command?: string
	environment?: Record<string, string>
	ports?: (string | {})[] // todo long syntax
}

export interface DockerComposeConfig {
	version?: string
	services: Record<string, DockerComposeServiceConfig>
}

export class DockerCompose {
	get options(): DockerComposeRunOptions {
		return {
			cwd: this.cwd,
			...this._options,
		}
	}

	constructor(private readonly cwd: string, private readonly _options: Partial<DockerComposeRunOptions> = {}) {}

	run(args: string[], options: Partial<DockerComposeRunOptions> = {}): RunningCommand {
		const thisOptions = this.options
		return runDockerCompose(args, {
			...thisOptions,
			...options,
			env: {
				...thisOptions.env,
				...options.env,
			},
		})
	}
}
