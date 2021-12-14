import type { IncomingMessage, ServerResponse } from 'http'
import { BaseController } from './BaseController'
import { LOGIN_TOKEN_PLACEHOLDER, SESSION_TOKEN_PLACEHOLDER } from './ApiController'
import { StaticFileHandler } from '../services/StaticFileHandler'
import { ProjectListProvider } from '../services/ProjectListProvider'
import { readAuthCookie } from '../utils/cookies'
import { S3Manager } from '../services/S3Manager'
import { BaseLoginConfig, customLoginConfigSchema } from '../loginConfig'

const CONTEMBER_CONFIG_PLACEHOLDER = '{configuration}'

interface LoginParams {
	projectGroup: string | undefined
}

export class LoginController extends BaseController<LoginParams> {
	constructor(
		private staticFileHandler: StaticFileHandler,
		private projectListProvider: ProjectListProvider,
		private s3Manager: S3Manager,
	) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse, { projectGroup }: LoginParams): Promise<void> {
		await this.staticFileHandler.serve(req, res, {
			fileProcessor: async (path, content, req) => {
				if (path === 'index.html') {
					const projects = await this.projectListProvider.get(projectGroup, readAuthCookie(req))
					let customConfig = {}
					try {
						const configContent = await this.s3Manager.getObjectContent({
							path: 'login-config.json',
						})
						customConfig = customLoginConfigSchema(JSON.parse(configContent))
					} catch (e) {
						if (!(typeof e === 'object' && 'name' in e && e.name === 'NoSuchKey')) {
							throw e
						}
					}
					const baseConfig: BaseLoginConfig = {
						apiBaseUrl: '/_api',
						loginToken: LOGIN_TOKEN_PLACEHOLDER,
						sessionToken: SESSION_TOKEN_PLACEHOLDER,
						projects,
					}
					const configJson = JSON.stringify({ ...baseConfig, ...customConfig })
					return content.toString('utf8').replace(CONTEMBER_CONFIG_PLACEHOLDER, configJson)
				}
				return content
			},
		})
	}
}
