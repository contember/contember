import { dirname, join } from 'node:path'
import jsyaml from 'js-yaml'
import { FileSystem } from './FileSystem'
import { JsonUpdateCallback, YamlHandler } from './YamlHandler'

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


const MAIN_CONFIGS = ['docker-compose.yaml', 'docker-compose.yml']


export class DockerComposeManager {
	constructor(
		private readonly dir: string,
		private readonly composeFile: string | undefined,
		private readonly fs: FileSystem,
		private readonly yamlHandler: YamlHandler,
	) {
	}

	tryReadMainDockerComposeConfig = async (dir: string = this.dir): Promise<DockerComposeConfig | null> => {
		const path = await this.resolvePath(dir, MAIN_CONFIGS)
		if (!path) {
			if (dir === '/') {
				return null
			}
			return await this.tryReadMainDockerComposeConfig(dirname(dir))
		}
		return jsyaml.load(await this.fs.readFile(path, 'utf8')) as DockerComposeConfig
	}

	updateMainDockerComposeConfig = async (
		updater: JsonUpdateCallback<DockerComposeConfig>,
		dir: string = this.dir,
	): Promise<void> => {
		const path = this.composeFile || (await this.resolvePath(dir, MAIN_CONFIGS)) || join(dir, MAIN_CONFIGS[0])
		return this.yamlHandler.updateYaml(path, updater, { createMissing: true })
	}

	private resolvePath = async (dir: string, possibleFileNames: string[]): Promise<string | null> => {
		for (const file of possibleFileNames) {
			const path = join(dir, file)
			if (await this.fs.pathExists(path)) {
				return path
			}
		}
		return null
	}

}
