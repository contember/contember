import { runCommand, RunningCommand } from './commands'
import { Readable, Writable } from 'stream'
import { tuple } from './tuple'
import { DockerComposeConfig } from '@contember/cli-common'

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
