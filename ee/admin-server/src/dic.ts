import { Builder } from '@contember/dic'
import { env } from './env'
import { S3Client } from '@aws-sdk/client-s3'
import { createClient as createRedisClient } from 'redis'
import { LoginController } from './controllers/LoginController'
import { DeployController } from './controllers/DeployController'
import { ProjectController } from './controllers/ProjectController'
import { TenantClient } from './services/TenantClient'
import { ApiController } from './controllers/ApiController'
import * as http from 'http'
import { S3Manager } from './services/S3Manager'
import { MeController } from './controllers/MeController'
import { LegacyController } from './controllers/LegacyController'
import { PanelController } from './controllers/PanelController'
import { StaticFileHandler } from './services/StaticFileHandler'
import { ProjectGroupResolver } from './services/ProjectGroupResolver'
import { ApiEndpointResolver } from './services/ApiEndpointResolver'
import { S3LocationResolver } from './services/S3LocationResolver'
import { CollaborationController } from './controllers/CollaborationController'
import { CollaborationRedisKeys, CollaborationRedisStorage } from './services/CollaborationStorage'
import { ApiRequestSender } from './services/ApiRequestSender'
import { SystemClient } from './services/SystemClient'
import { ConfigResolver } from './services/ConfigResolver'
import { Router } from './services/Router'

export default new Builder({})
	.addService('env', env)

	.addService('projectGroupResolver', ({ env }) => {
		return new ProjectGroupResolver(env.CONTEMBER_PROJECT_GROUP_DOMAIN_MAPPING)
	})

	.addService('apiEndpointResolver', ({ env }) => {
		return new ApiEndpointResolver(env.CONTEMBER_API_ENDPOINT, env.CONTEMBER_API_HOSTNAME)
	})

	.addService('apiRequestSender', ({ apiEndpointResolver }) => {
		return new ApiRequestSender(apiEndpointResolver)
	})

	.addService('tenant', ({ apiRequestSender }) => {
		return new TenantClient(apiRequestSender)
	})

	.addService('systemClient', ({ apiRequestSender }) => {
		return new SystemClient(apiRequestSender)
	})


	.addService('s3LocationResolver', ({ env }) => {
		return new S3LocationResolver(env.CONTEMBER_S3_BUCKET, env.CONTEMBER_S3_PREFIX)
	})

	.addService('s3Client', ({ env }) => {
		const credentialsOptions = env.CONTEMBER_S3_KEY === '' && env.CONTEMBER_S3_SECRET === ''
			? {}
			: { credentials: { accessKeyId: env.CONTEMBER_S3_KEY, secretAccessKey: env.CONTEMBER_S3_SECRET } }

		return new S3Client({
			endpoint: env.CONTEMBER_S3_ENDPOINT,
			region: env.CONTEMBER_S3_REGION,
			forcePathStyle: true,
			...credentialsOptions,
		})
	})

	.addService('redisClient', ({ env }) => {
		if (env.REDIS_HOST) {
			return createRedisClient({ url: env.REDIS_HOST }) as any // Cast because otherwise it would require explicit type on export
		}
	})

	.addService('collaborationRedisKeys', ({ env }) => {
		if (env.REDIS_PREFIX) {
			return new CollaborationRedisKeys(env.REDIS_PREFIX)
		}
	})

	.addService('collaborationStorage', ({ redisClient, collaborationRedisKeys }) => {
		if (redisClient !== undefined && collaborationRedisKeys !== undefined) {
			return new CollaborationRedisStorage(redisClient as ReturnType<typeof createRedisClient>, collaborationRedisKeys)
		}
	})

	.addService('s3', ({ s3Client, s3LocationResolver }) => {
		return new S3Manager(s3Client, s3LocationResolver)
	})

	.addService('configResolver', ({ s3 }) => {
		return new ConfigResolver(s3)
	})

	.addService('staticFileHandler', ({ env }) => {
		return new StaticFileHandler(env.CONTEMBER_PUBLIC_DIR)
	})

	.addService('loginController', ({ staticFileHandler, configResolver }) => {
		return new LoginController(staticFileHandler, configResolver)
	})

	.addService('deployController', ({ tenant, systemClient, s3 }) => {
		return new DeployController(tenant, systemClient, s3)
	})

	.addService('projectController', ({ tenant, s3 }) => {
		return new ProjectController(tenant, s3)
	})

	.addService('apiController', ({ env, apiEndpointResolver }) => {
		return new ApiController(apiEndpointResolver, env.CONTEMBER_LOGIN_TOKEN)
	})

	.addService('meController', ({ tenant, s3, configResolver }) => {
		return new MeController(tenant, s3, configResolver)
	})

	.addService('legacyController', () => {
		return new LegacyController()
	})

	.addService('panelController', ({ env, staticFileHandler }) => {
		return new PanelController(staticFileHandler, env.CONTEMBER_INVITE_METHOD)
	})

	.addService('collaborationController', ({ collaborationStorage, projectGroupResolver, tenant }) => {
		if (collaborationStorage) {
			return new CollaborationController(collaborationStorage, projectGroupResolver, tenant)
		}
	})

	.addService('router', ({ loginController, deployController, projectController, apiController, meController, legacyController, panelController, projectGroupResolver }) => {
		return new Router(
			projectGroupResolver,
			deployController,
			meController,
			apiController,
			loginController,
			legacyController,
			panelController,
			projectController,
		)
	})

	.addService('httpServer', ({ router, collaborationController }) => {
		const server = http.createServer()

		server.on('request', async (req, res) => {
			const startTime = process.hrtime()

			const handler = router.getHandler(req)
			await handler(req, res)

			const elapsedTime = process.hrtime(startTime)
			const elapsedTimeMs = ((elapsedTime[0] + elapsedTime[1] / 1e9) * 1e3).toFixed(0)
			console.info(`[http] [${res.statusCode}] ${req.method} ${req.url} ${elapsedTimeMs}ms`)
		})

		if (collaborationController) {
			server.on('upgrade', (request, socket, head) => {
				collaborationController.protocol.handleUpgrade(request, socket as any, head)
			})
		}

		return server
	})

	.build()
