import { BaseController } from './BaseController'
import type { IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'

const OLD_PROJECT_URL_PATTERN = /^\/p\/([^\/]+)(\/[^\/]+(\/null)?)?/

export class LegacyController extends BaseController {
	async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const url = new URL(req.url ?? '/', `http://${req.headers.host}`)

		if (url.pathname === '/projects') {
			res.writeHead(301, { Location: '/' })
			res.end()
			return
		}

		if (url.pathname.match(OLD_PROJECT_URL_PATTERN) !== null) {
			res.writeHead(301, { Location: url.pathname.replace(OLD_PROJECT_URL_PATTERN, '/$1') })
			res.end()
			return
		}

		res.writeHead(404)
		res.end()
	}
}
