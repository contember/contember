import type { IncomingMessage, ServerResponse } from 'http'
import { BaseController } from './BaseController'
import type { ProjectListProvider } from '../project'
import { LOGIN_TOKEN_PLACEHOLDER } from './ApiController'
import { createServe } from '../utils/serve'

const CONTEMBER_CONFIG_PLACEHOLDER = '{configuration}'

export class LoginController extends BaseController {
	private serve = createServe(this.publicDir, async (path, content, req) => {
		if (path === 'index.html') {
			const projects = await this.projectListProvider.get(this.readAuthCookie(req))
			const configJson = JSON.stringify({ apiBaseUrl: '/_api', loginToken: LOGIN_TOKEN_PLACEHOLDER, projects })
			return content.toString('utf8').replace(CONTEMBER_CONFIG_PLACEHOLDER, configJson)
		}
		return content
	})

	constructor(
		private publicDir: string,
		private projectListProvider: ProjectListProvider,
	) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		await this.serve(req, res)
	}
}
