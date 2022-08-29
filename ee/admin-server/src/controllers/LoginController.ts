import type { IncomingMessage, ServerResponse } from 'http'
import { BaseController } from './BaseController'
import { StaticFileHandler } from '../services/StaticFileHandler'
import { ConfigResolver } from '../services/ConfigResolver'

const CONTEMBER_CONFIG_PLACEHOLDER = '{configuration}'

interface LoginParams {
	projectGroup: string | undefined
}

export class LoginController extends BaseController<LoginParams> {
	constructor(
		private staticFileHandler: StaticFileHandler,
		private configResolver: ConfigResolver,
	) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse, { projectGroup }: LoginParams): Promise<void> {
		await this.staticFileHandler.serve(req, res, {
			fileProcessor: async (path, content, req) => {
				if (path === 'index.html') {
					const customConfig = await this.configResolver.getConfig(projectGroup)
					const configJson = JSON.stringify(customConfig.login ?? {})
					return content.toString('utf8').replace(CONTEMBER_CONFIG_PLACEHOLDER, configJson)
				}

				return content
			},
		})
	}
}
