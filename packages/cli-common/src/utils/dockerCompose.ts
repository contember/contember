import { join } from 'path'
import { pathExists } from 'fs-extra'
import { JsonUpdateCallback, readMultipleYaml, updateYaml } from './yaml'

const OVERRIDE_CONFIGS = ['docker-compose.override.yaml', 'docker-compose.override.yml']
const MAIN_CONFIGS = ['docker-compose.yaml', 'docker-compose.yml']

export interface DockerComposeServiceConfig {
	image?: string
	command?: string
	user?: string
	environment?: Record<string, string>
	ports?: (string | {})[] // todo long syntax
}

export interface DockerComposeConfig {
	[key: string]: unknown

	version?: string
	services?: Record<string, DockerComposeServiceConfig>
}

const resolvePath = async (dir: string, possibleFileNames: string[], fallbackFileName: string): Promise<string> => {
	for (const file of possibleFileNames) {
		const path = join(dir, file)
		if (await pathExists(path)) {
			return path
		}
	}
	return join(dir, fallbackFileName)
}

export const updateOverrideConfig = async (
	dir: string,
	updater: JsonUpdateCallback<DockerComposeConfig>,
): Promise<void> => {
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

export const readDefaultDockerComposeConfig = async (dir: string): Promise<DockerComposeConfig> => {
	const candidates = process.env.COMPOSE_FILE ? [process.env.COMPOSE_FILE] : [...MAIN_CONFIGS, ...OVERRIDE_CONFIGS]

	return await readMultipleYaml<DockerComposeConfig>(candidates.map(it => join(dir, it)))
}
