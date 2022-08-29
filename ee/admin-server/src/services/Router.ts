import { IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'
import { readHostFromHeader } from '../utils/readHostFromHeader'
import { BadRequestError } from '../BadRequestError'
import { ProjectGroupResolver } from './ProjectGroupResolver'
import { DeployController } from '../controllers/DeployController'
import { MeController } from '../controllers/MeController'
import { ApiController } from '../controllers/ApiController'
import { LoginController } from '../controllers/LoginController'
import { LegacyController } from '../controllers/LegacyController'
import { PanelController } from '../controllers/PanelController'
import { ProjectController } from '../controllers/ProjectController'

export class Router {
	constructor(
		private readonly projectGroupResolver: ProjectGroupResolver,
		private readonly deployController: DeployController,
		private readonly meController: MeController,
		private readonly apiController: ApiController,
		private readonly loginController: LoginController,
		private readonly legacyController: LegacyController,
		private readonly panelController: PanelController,
		private readonly projectController: ProjectController,
	) {
	}

	getHandler(req: IncomingMessage): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
		const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
		const [prefix, ...rest] = url.pathname.substring(1).split('/')

		try {
			const hostname = readHostFromHeader(req)
			const projectGroup = this.projectGroupResolver.resolve(hostname)

			switch (prefix) {
				case '_api':
					return (req, res) => this.apiController.handle(req, res, { path: rest.join('/'), projectGroup })

				case '_deploy':
					return (req, res) => this.deployController.handle(req, res, { projectGroup })

				case '_me':
					return (req, res) => this.meController.handle(req, res, { projectGroup })

				case '_panel':
					return (req, res) => this.panelController.handle(req, res)

				case '':
				case '_static':
				case 'favicon.ico':
				case 'robots.txt':
					return (req, res) => this.loginController.handle(req, res, { projectGroup })

				case 'p':
				case 'projects':
					return (req, res) => this.legacyController.handle(req, res)

				default:
					return (req, res) => this.projectController.handle(req, res, { projectSlug: prefix, path: rest.join('/'), projectGroup })
			}

		} catch (e) {
			console.error(e)

			return async (req, res) => {
				if (e instanceof BadRequestError) {
					res.writeHead(e.code).end(e.message)

				} else if (!res.headersSent) {
					res.writeHead(500).end('Server error')
				}
			}
		}
	}
}
