import { Workspace } from './Workspace'
import { join } from 'node:path'
import { YamlHandler } from '../fs/YamlHandler'

export interface LocalProjectConfig {
	apiDir?: string
	migrationsDir?: string
	adminDir?: string | false
	adminDistDir?: string
}

export class WorkspaceResolver {
	constructor(
		private readonly yamlHandler: YamlHandler,
	) {
	}

	resolve = async (baseDir: string): Promise<Workspace> => {
		const config = await this.readConfig(baseDir)
		const apiDir = config.apiDir ?? join(baseDir, 'api')
		const migrationsDir = config.migrationsDir ?? join(apiDir, 'migrations')
		const adminDir = config.adminDir === false ? undefined : (config.adminDir ?? join(baseDir, 'admin'))
		const adminDistDir = adminDir === undefined ? undefined : (config.adminDistDir ?? join(adminDir, 'dist'))

		return {
			baseDir,
			apiDir,
			migrationsDir,
			adminDir,
			adminDistDir,
		}
	}

	private async readConfig(baseDir: string): Promise<LocalProjectConfig> {
		const configPath = join(baseDir, 'contember.yaml')
		try {
			return await this.yamlHandler.readYaml(configPath)
		} catch (e: any) {
			if (e.code === 'ENOENT') {
				return {}
			}
			throw e
		}
	}
}
