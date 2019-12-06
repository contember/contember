import { promises as fs } from 'fs'
import jsyaml from 'js-yaml'
import { pathExists } from 'fs-extra'
import { join } from 'path'
import { Merger } from '@contember/config-loader'
import { execCommand } from './commands'
import { Readable, Writable } from 'stream'
import { JsonUpdateCallback, readYaml, updateYaml } from './yaml'

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
	const configs: any = []
	for (const file of candidates) {
		const path = join(dir, file)
		const exists = await pathExists(path)
		if (!exists) {
			continue
		}
		const stats = await fs.lstat(path)
		if (!stats.isFile()) {
			continue
		}
		const config = await readYaml(path)
		configs.push(config)
	}
	return Merger.merge(...configs)
}

export const hasConfiguredPorts = (config: any, service: string): boolean => {
	// eslint-disable-next-line prettier/prettier
	const ports = config?.[service]?.ports
	return ports && Array.isArray(ports) && ports.length > 0
}

export const execDockerCompose = async (
	args: string[],
	options: { cwd: string; stdin?: string; stdout?: Writable | false; env?: NodeJS.ProcessEnv },
): Promise<string> => {
	const input = new Readable()
	const command = execCommand('docker-compose', args, {
		cwd: options.cwd,
		stdout: options.stdout === false ? undefined : options.stdout || process.stdout,
		stderr: process.stderr,
		stdin: input,
		env: {
			// todo
			CONTEMBER_VERSION: '0',
		},
	})
	input.push(options.stdin)
	input.push(null)
	return await command
}
