import { join } from 'node:path'
import { pathExists } from '@contember/cli-common'
import { JsonUpdateCallback, updateYaml } from './yaml'
import jsyaml from 'js-yaml'
import * as fs from 'node:fs/promises'

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

const resolvePath = async (dir: string, possibleFileNames: string[]): Promise<string | null> => {
	for (const file of possibleFileNames) {
		const path = join(dir, file)
		if (await pathExists(path)) {
			return path
		}
	}
	return null
}

export const resolveMainDockerComposeConfig = async (dir: string): Promise<string | null> => {
	return resolvePath(dir, MAIN_CONFIGS)
}

export const tryReadMainDockerComposeConfig = async (dir: string): Promise<DockerComposeConfig | null> => {
	const path = await resolveMainDockerComposeConfig(dir)
	if (!path) {
		return null
	}
	return jsyaml.load(await fs.readFile(path, 'utf8')) as DockerComposeConfig
}

export const updateMainDockerComposeConfig = async (
	dir: string,
	updater: JsonUpdateCallback<DockerComposeConfig>,
): Promise<void> => {
	const path = process.env.COMPOSE_FILE || (await resolvePath(dir, MAIN_CONFIGS)) || join(dir, MAIN_CONFIGS[0])
	return updateYaml(path, updater, { createMissing: true })
}


export const contemberDockerImages = ['contember/engine', 'contember/engine-ee', 'contember/cli']
