import { join } from 'path'
import { JsonUpdateCallback, updateYaml } from './yaml'
import { pathExists } from '@contember/cli-common'

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

export const updateMainDockerComposeConfig = async (
	dir: string,
	updater: JsonUpdateCallback<DockerComposeConfig>,
): Promise<void> => {
	const path = process.env.COMPOSE_FILE || (await resolvePath(dir, MAIN_CONFIGS, MAIN_CONFIGS[0]))
	return updateYaml(path, updater, { createMissing: true })
}
