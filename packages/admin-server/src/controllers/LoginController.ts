import type { IncomingMessage, ServerResponse } from 'http'
import { readFile } from 'fs/promises'
import { getType } from 'mime'
import { BaseController } from './BaseController'
import { URL } from 'url'
import type { ProjectListProvider } from '../project'

const CONTEMBER_CONFIG_PLACEHOLDER = '{configuration}'

export class LoginController extends BaseController {
	constructor(
		private apiEndpoint: string,
		private loginToken: string,
		private publicDir: string,
		private projectListProvider: ProjectListProvider,
	) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
		const path = url.pathname === '/' ? 'index.html' : url.pathname.substring(1)
		const contentType = getType(path) ?? 'application/octet-stream'

		try {
			const content = await readFile(this.publicDir + '/' + path)
			res.setHeader('Content-Type', contentType)

			if (path === 'index.html') {
				const projects = await this.projectListProvider.get(this.readAuthCookie(req))
				const configJson = JSON.stringify({ apiBaseUrl: '/_api', loginToken: this.loginToken, projects })
				res.end(content.toString('utf8').replace(CONTEMBER_CONFIG_PLACEHOLDER, configJson))

			} else {
				res.end(content)
			}

		} catch (e) {
			res.writeHead(404)
			res.end()
		}
	}
}
