import type { IncomingMessage, ServerResponse } from 'http'
import { BaseController } from './BaseController'
import type { ProjectListProvider } from '../project'
import { LOGIN_TOKEN_PLACEHOLDER, SESSION_TOKEN_PLACEHOLDER } from './ApiController'
import { ProcessFile, StaticFileHandler } from '../http/StaticFileHandler'

const CONTEMBER_CONFIG_PLACEHOLDER = '{configuration}'

export class LoginController extends BaseController {
	private fileProcessor: ProcessFile = async (path, content, req) => {
		if (path === 'index.html') {
			const projects = await this.projectListProvider.get(this.readAuthCookie(req))
			const configJson = JSON.stringify({
				apiBaseUrl: '/_api',
				loginToken: LOGIN_TOKEN_PLACEHOLDER,
				sessionToken: SESSION_TOKEN_PLACEHOLDER,
				projects,
			})
			return content.toString('utf8').replace(CONTEMBER_CONFIG_PLACEHOLDER, configJson)
		}
		return content
	}

	constructor(
		private staticFileHandler: StaticFileHandler,
		private projectListProvider: ProjectListProvider,
	) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		await this.staticFileHandler.serve(req, res, {
			fileProcessor: this.fileProcessor,
		})
	}
}
