import { S3Manager } from './S3Manager'
import { CustomConfig, customConfig } from '../config'

export class ConfigResolver {
	constructor(
		private s3Manager: S3Manager,
		private baseConfig: CustomConfig,
	) {
	}

	async getConfig(projectGroup: string | undefined): Promise<CustomConfig> {
		let config: CustomConfig = {}

		try {
			const configContent = await this.s3Manager.getObjectContent({
				projectGroup,
				path: 'config.json',
			})

			config = customConfig(JSON.parse(configContent))

		} catch (e) {
			if (!(typeof e === 'object' && e !== null && 'name' in e && (e as { name?: unknown }).name === 'NoSuchKey')) {
				throw e
			}
		}

		config = {
			...this.baseConfig,
			...config,
			login: {
				...this.baseConfig.login,
				...config.login,
			},
		}

		return config
	}
}
