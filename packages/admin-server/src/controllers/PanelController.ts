import type { IncomingMessage, ServerResponse } from 'http'
import { BaseController } from './BaseController'
import { SESSION_TOKEN_PLACEHOLDER } from './ApiController'
import { ProcessFile, StaticFileHandler } from '../http/StaticFileHandler'

const CONTEMBER_CONFIG_PLACEHOLDER = '{configuration}'

export class PanelController extends BaseController {
	private fileProcessor: ProcessFile = async (path, content) => {
		if (path === 'index.html') {
			const configJson = JSON.stringify({ apiBaseUrl: '/_api', sessionToken: SESSION_TOKEN_PLACEHOLDER })
			return content.toString('utf8').replace(CONTEMBER_CONFIG_PLACEHOLDER, configJson)
		}
		return content
	}

	constructor(private staticFileHandler: StaticFileHandler) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		await this.staticFileHandler.serve(req, res, {
			basePath: '/_panel/',
			fileProcessor: this.fileProcessor,
		})
	}
}
