import * as Koa from 'koa'
import * as koaCompose from 'koa-compose'
import { route } from '../core/koa/router'
import { ProjectContainer } from '../CompositionRoot'
import ProjectMemberManager from '../tenant-api/model/service/ProjectMemberManager'
import * as corsMiddleware from '@koa/cors'
import * as bodyParser from 'koa-bodyparser'
import { createGraphqlInvalidAuthResponse } from './responseUtils'
import KnexWrapper from '../core/knex/KnexWrapper'
import { setupSystemVariables } from '../system-api/SystemVariablesSetupHelper'

export default class SystemMiddlewareFactory {
	constructor(
		private readonly projectContainers: ProjectContainer[],
		private readonly projectMemberManager: ProjectMemberManager
	) {}

	create(): Koa.Middleware {
		return route('/system/:projectSlug$', async (ctx, next) => {
			const projectContainer = this.projectContainers.find(projectContainer => {
				return projectContainer.get('project').slug === ctx.state.params.projectSlug
			})

			if (projectContainer === undefined) {
				return ctx.throw(404, `Project ${ctx.state.params.projectSlug} NOT found`)
			}

			const systemKoa = new Koa()
			systemKoa.use(corsMiddleware())
			systemKoa.use(bodyParser())

			systemKoa.use(async (ctx, next) => {

				if (ctx.state.authResult === undefined) {
					return createGraphqlInvalidAuthResponse(ctx,
						'/system endpoint requires authorization, see /tenant endpoint and signIn() mutation'
					)
				}

				if (!ctx.state.authResult.valid) {
					return createGraphqlInvalidAuthResponse(ctx, `Auth failure: ${ctx.state.authResult.error}`)
				}

				const project = projectContainer.get('project')

				const [projectRoles, projectVariables] = await Promise.all([
					this.projectMemberManager.getProjectRoles(project.uuid, ctx.state.authResult.identityId),
					this.projectMemberManager.getProjectVariables(project.uuid, ctx.state.authResult.identityId),
				])
				const db = new KnexWrapper(projectContainer.knexConnection, 'system')
				const serverFactory = projectContainer.get('systemApolloServerFactory')
				const server = serverFactory.create(projectRoles.roles, projectVariables)
				const apolloKoa = new Koa()
				server.applyMiddleware({
					app: apolloKoa,
					path: '/',
					disableHealthCheck: true,
					cors: false,
					bodyParserConfig: false,
				})

				await db.transaction(async db => {
					await db.raw('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ')
					console.log((await db.raw('select pg_export_snapshot() as id')).rows[0].id)
					await setupSystemVariables(db, ctx.state.authResult.identityId)
					ctx.state.db = db
					ctx.state.errorHandler = () => db.knex.rollback()
					await koaCompose(apolloKoa.middleware)(ctx, next)
				})

			})

			await koaCompose(systemKoa.middleware)(ctx, next)
		})
	}
}
