import type { IncomingMessage, ServerResponse } from 'http'
import { BaseController } from './BaseController'
import { StaticFileHandler } from '../services/StaticFileHandler'
import { PanelConfig } from '../config'

type InviteMethod = 'CREATE_PASSWORD' | 'RESET_PASSWORD' | undefined
const CONTEMBER_CONFIG_PLACEHOLDER = '{configuration}'

export class PanelController extends BaseController {
	constructor(
		private staticFileHandler: StaticFileHandler,
		private inviteMethod: InviteMethod,
	) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		await this.staticFileHandler.serve(req, res, {
			basePath: '/_panel/',
			fileProcessor: async (path, content, req) => {
				if (path === 'index.html') {
					const config: PanelConfig = { inviteMethod: this.inviteMethod }
					const configJson = JSON.stringify(config)
					return content.toString('utf8').replace(CONTEMBER_CONFIG_PLACEHOLDER, configJson)

				} else {
					return content
				}
			},
		})
	}
}
