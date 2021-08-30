import { Builder } from '@contember/dic'
import { env } from './env'
import { S3Client } from '@aws-sdk/client-s3'
import { LoginController } from './controllers/LoginController'
import { DeployController } from './controllers/DeployController'
import { ProjectController } from './controllers/ProjectController'
import { TenantApi } from './tenant'
import { ApiController } from './controllers/ApiController'
import * as http from 'http'
import { URL } from 'url'
import { S3Manager } from './s3'
import { ProjectListProvider } from './project'
import { MeController } from './controllers/MeController'
import { LegacyController } from './controllers/LegacyController'

export default new Builder({})
	.addService('env', env)

	.addService('tenant', ({ env }) => {
		return new TenantApi(env.CONTEMBER_API_ENDPOINT)
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

	.addService('s3', ({ s3Client, env }) => {
		return new S3Manager(s3Client, env.CONTEMBER_S3_BUCKET, env.CONTEMBER_S3_PREFIX)
	})

	.addService('projectListProvider', ({ tenant, s3 }) => {
		return new ProjectListProvider(tenant, s3)
	})

	.addService('loginController', ({ env, projectListProvider }) => {
		return new LoginController(env.CONTEMBER_PUBLIC_DIR, projectListProvider)
	})

	.addService('deployController', ({ tenant, s3 }) => {
		return new DeployController(tenant, s3)
	})

	.addService('projectController', ({ tenant, s3 }) => {
		return new ProjectController(tenant, s3)
	})

	.addService('apiController', ({ env, projectListProvider }) => {
		return new ApiController(env.CONTEMBER_API_ENDPOINT, env.CONTEMBER_LOGIN_TOKEN, projectListProvider)
	})

	.addService('meController', ({ tenant, s3 }) => {
		return new MeController(tenant, s3)
	})

	.addService('legacyController', () => {
		return new LegacyController()
	})

	.addService('httpServer', ({ loginController, deployController, projectController, apiController, meController, legacyController }) => {
		return http.createServer(async (req, res) => {
			const startTime = process.hrtime()
			const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
			const [prefix, ...rest] = url.pathname.substring(1).split('/')

			try {
				switch (prefix) {
					case '_deploy':
						await deployController.handle(req, res)
						break

					case '_me':
						await meController.handle(req, res)
						break

					case '_api':
						await apiController.handle(req, res, { path: rest.join('/') })
						break

					case '':
					case '_static':
						await loginController.handle(req, res)
						break

					case 'p':
					case 'projects':
						await legacyController.handle(req, res)
						break

					default:
						await projectController.handle(req, res, { projectSlug: prefix, path: rest.join('/') })
						break
				}

				const elapsedTime = process.hrtime(startTime)
				const elapsedTimeMs = ((elapsedTime[0] + elapsedTime[1] / 1e9) * 1e3).toFixed(0)
				console.info(`[http] [${res.statusCode}] ${req.method} ${req.url} ${elapsedTimeMs}ms`)
			} catch (e) {
				res.headersSent || res.writeHead(500).end('Server error')
				console.error(`[http] [${res.statusCode}] ${req.method} ${req.url}`, e)
			}
		})
	})

	.build()
