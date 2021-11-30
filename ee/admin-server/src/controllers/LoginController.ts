import type { IncomingMessage, ServerResponse } from 'http'
import { BaseController } from './BaseController'
import { LOGIN_TOKEN_PLACEHOLDER, SESSION_TOKEN_PLACEHOLDER } from './ApiController'
import { ProcessFile, StaticFileHandler } from '../services/StaticFileHandler'
import { ProjectListProvider } from '../services/ProjectListProvider'

const CONTEMBER_CONFIG_PLACEHOLDER = '{configuration}'

interface LoginParams {
	projectGroup: string | undefined
}

export class LoginController extends BaseController<LoginParams> {
	constructor(
		private staticFileHandler: StaticFileHandler,
		private projectListProvider: ProjectListProvider,
	) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse, { projectGroup }: LoginParams): Promise<void> {
		await this.staticFileHandler.serve(req, res, {
			fileProcessor: async (path, content, req) => {
				if (path === 'index.html') {
					const projects = await this.projectListProvider.get(projectGroup, this.readAuthCookie(req))
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
			,
		})
	}
}
