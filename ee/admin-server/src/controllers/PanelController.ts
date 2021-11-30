import type { IncomingMessage, ServerResponse } from 'http'
import { BaseController } from './BaseController'
import { StaticFileHandler } from '../services/StaticFileHandler'

export class PanelController extends BaseController {
	constructor(private staticFileHandler: StaticFileHandler) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		await this.staticFileHandler.serve(req, res, {
			basePath: '/_panel/',
		})
	}
}
