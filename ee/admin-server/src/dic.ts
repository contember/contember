import { Builder } from '@contember/dic'
import { env } from './env'
import { S3Client } from '@aws-sdk/client-s3'
import { LoginController } from './controllers/LoginController'
import { DeployController } from './controllers/DeployController'
import { ProjectController } from './controllers/ProjectController'
import { TenantClient } from './services/TenantClient'
import { ApiController } from './controllers/ApiController'
import * as http from 'http'
import { URL } from 'url'
import { S3Manager } from './services/S3Manager'
import { MeController } from './controllers/MeController'
import { LegacyController } from './controllers/LegacyController'
import { PanelController } from './controllers/PanelController'
import { StaticFileHandler } from './services/StaticFileHandler'
import { ProjectGroupResolver } from './services/ProjectGroupResolver'
import { ApiEndpointResolver } from './services/ApiEndpointResolver'
import { BadRequestError } from './BadRequestError'
import { S3LocationResolver } from './services/S3LocationResolver'
import { readHostFromHeader } from './utils/readHostFromHeader'
import { ProjectListProvider } from './services/ProjectListProvider'

export default new Builder({})
	.addService('env', env)

	.addService('projectGroupResolver', ({ env }) => {
		return new ProjectGroupResolver(env.CONTEMBER_PROJECT_GROUP_DOMAIN_MAPPING)
	})

	.addService('apiEndpointResolver', ({ env }) => {
		return new ApiEndpointResolver(env.CONTEMBER_API_ENDPOINT, env.CONTEMBER_API_HOSTNAME)
	})

	.addService('tenant', ({ apiEndpointResolver }) => {
		return new TenantClient(apiEndpointResolver)
	})

	.addService('s3LocationResolver', ({ env }) => {
		return new S3LocationResolver(env.CONTEMBER_S3_BUCKET, env.CONTEMBER_S3_PREFIX)
	})

	.addService('s3Client', ({ env }) => {
		return new S3Client({
			endpoint: env.CONTEMBER_S3_ENDPOINT,
			region: env.CONTEMBER_S3_REGION,
			forcePathStyle: true,
			credentials: {
				accessKeyId: env.CONTEMBER_S3_KEY,
				secretAccessKey: env.CONTEMBER_S3_SECRET,
			},
		})
	})

	.addService('s3', ({ s3Client, s3LocationResolver }) => {
		return new S3Manager(s3Client, s3LocationResolver)
	})

	.addService('projectListProvider', ({ tenant, s3 }) => {
		return new ProjectListProvider(tenant, s3)
	})

	.addService('staticFileHandler', ({ env }) => {
		return new StaticFileHandler(env.CONTEMBER_PUBLIC_DIR)
	})

	.addService('loginController', ({ staticFileHandler, projectListProvider }) => {
		return new LoginController(staticFileHandler, projectListProvider)
	})

	.addService('deployController', ({ tenant, s3 }) => {
		return new DeployController(tenant, s3)
	})

	.addService('projectController', ({ tenant, s3 }) => {
		return new ProjectController(tenant, s3)
	})

	.addService('apiController', ({ env, projectListProvider, apiEndpointResolver }) => {
		return new ApiController(apiEndpointResolver, env.CONTEMBER_LOGIN_TOKEN, projectListProvider)
	})

	.addService('meController', ({ tenant, s3 }) => {
		return new MeController(tenant, s3)
	})

	.addService('legacyController', () => {
		return new LegacyController()
	})

	.addService('panelController', ({ staticFileHandler }) => {
		return new PanelController(staticFileHandler)
	})

	.addService('httpServer', ({ loginController, deployController, projectController, apiController, meController, legacyController, panelController, projectGroupResolver }) => {
		return http.createServer(async (req, res) => {
			const startTime = process.hrtime()
			const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
			const [prefix, ...rest] = url.pathname.substring(1).split('/')
			const hostname = readHostFromHeader(req)
			const projectGroup = projectGroupResolver.resolve(hostname)

			try {
				switch (prefix) {
					case '_deploy':
						await deployController.handle(req, res, { projectGroup })
						break

					case '_me':
						await meController.handle(req, res, { projectGroup })
						break

					case '_api':
						await apiController.handle(req, res, { path: rest.join('/'), projectGroup })
						break

					case '':
					case '_static':
						await loginController.handle(req, res, { projectGroup })
						break

					case 'p':
					case 'projects':
						await legacyController.handle(req, res)
						break

					case '_panel':
						await panelController.handle(req, res)
						break

					default:
						await projectController.handle(req, res, { projectSlug: prefix, path: rest.join('/'), projectGroup })
						break
				}

				const elapsedTime = process.hrtime(startTime)
				const elapsedTimeMs = ((elapsedTime[0] + elapsedTime[1] / 1e9) * 1e3).toFixed(0)
				console.info(`[http] [${res.statusCode}] ${req.method} ${req.url} ${elapsedTimeMs}ms`)
			} catch (e) {
				if (e instanceof BadRequestError) {
					res.writeHead(e.code).end(e.message)
				} else if (!res.headersSent) {
					res.writeHead(500).end('Server error')
				}
				console.error(`[http] [${res.statusCode}] ${req.method} ${req.url}`, e)
			}
		})
	})

	.build()
