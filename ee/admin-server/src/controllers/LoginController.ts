import type { IncomingMessage, ServerResponse } from 'http'
import { BaseController } from './BaseController'
import { LOGIN_TOKEN_PLACEHOLDER } from './ApiController'
import { StaticFileHandler } from '../services/StaticFileHandler'
import { S3Manager } from '../services/S3Manager'
import { BaseLoginConfig, customLoginConfigSchema } from '../config'
import { ConfigResolver } from '../services/ConfigResolver'

const CONTEMBER_CONFIG_PLACEHOLDER = '{configuration}'

interface LoginParams {
	projectGroup: string | undefined
}

export class LoginController extends BaseController<LoginParams> {
	constructor(
		private staticFileHandler: StaticFileHandler,
		private s3Manager: S3Manager,
		private configResolver: ConfigResolver,
	) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse, { projectGroup }: LoginParams): Promise<void> {
		await this.staticFileHandler.serve(req, res, {
			fileProcessor: async (path, content, req) => {
				if (path === 'index.html') {
					const projects = await this.s3Manager.listProjectSlugs({ projectGroup })
					const customConfig = await this.configResolver.getConfig(projectGroup)
					const baseConfig: BaseLoginConfig = {
						apiBaseUrl: '/_api',
						loginToken: LOGIN_TOKEN_PLACEHOLDER,
						projects,
					}
					const configJson = JSON.stringify({ ...baseConfig, ...customConfig.login })
					return content.toString('utf8').replace(CONTEMBER_CONFIG_PLACEHOLDER, configJson)
				}
				return content
			},
		})
	}
}
