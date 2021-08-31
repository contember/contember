import type { IncomingMessage, ServerResponse } from 'http'
import { BaseController } from './BaseController'
import { SESSION_TOKEN_PLACEHOLDER } from './ApiController'
import { createServe } from '../utils/serve'

const CONTEMBER_CONFIG_PLACEHOLDER = '{configuration}'

export class PanelController extends BaseController {
	private serve = createServe(this.publicDir, '/_panel/',  async (path, content, req) => {
		if (path === 'index.html') {
			const configJson = JSON.stringify({ apiBaseUrl: '/_api', sessionToken: SESSION_TOKEN_PLACEHOLDER })
			return content.toString('utf8').replace(CONTEMBER_CONFIG_PLACEHOLDER, configJson)
		}
		return content
	})

	constructor(private publicDir: string) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		await this.serve(req, res)
	}
}
