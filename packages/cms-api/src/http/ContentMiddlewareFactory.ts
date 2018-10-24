import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import KnexConnection from '../core/knex/KnexConnection'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import { Context } from '../content-api/types'
import * as Koa from 'koa'
import * as koaCompose from 'koa-compose'
import { ContextWithRequest, get, route } from '../core/koa/router'
import * as corsMiddleware from '@koa/cors'
import * as bodyParser from 'koa-bodyparser'
import PlaygroundMiddlewareFactory from './PlaygroundMiddlewareFactory'
import { ProjectContainer } from '../CompositionRoot'
import ProjectMemberManager from '../tenant-api/model/service/ProjectMemberManager'
import { GraphQLSchema } from 'graphql'
import PermissionFactory from '../acl/PermissionFactory'

class ContentMiddlewareFactory {
	constructor(private projectContainers: ProjectContainer[], private projectMemberManager: ProjectMemberManager) {}

	create(): Koa.Middleware {
		return route(
			'/content/:projectSlug/:stageSlug$',
			async (
				ctx: AuthMiddlewareFactory.ContextWithAuth & ContextWithRequest & { state: { db: KnexConnection } },
				next
			) => {
				const projectContainer = this.projectContainers.find(projectContainer => {
					return projectContainer.get('project').slug === ctx.state.params.projectSlug
				})

				if (projectContainer === undefined) {
					return ctx.throw(404, `Project ${ctx.state.params.projectSlug} NOT found`)
				}

				const project = projectContainer.get('project')

				const stage = project.stages.find(stage => stage.slug === ctx.state.params.stageSlug)

				if (stage === undefined) {
					return ctx.throw(404, `Stage ${ctx.state.params.stageSlug} NOT found`)
				}

				const db = projectContainer.get('knexConnection')
				ctx.state.db = new KnexConnection(db, 'stage_' + stage.slug)

				const contentKoa = new Koa()
				contentKoa.use(corsMiddleware())
				contentKoa.use(bodyParser())
				contentKoa.use(get('/', new PlaygroundMiddlewareFactory().create()))

				contentKoa.use(async (ctx: AuthMiddlewareFactory.ContextWithAuth & { state: { db: KnexConnection } }, next) => {
					await ctx.state.db.transaction(async knexConnection => {
						ctx.state.db = knexConnection
						if (ctx.state.authResult === undefined) {
							throw new AuthenticationError(
								'/content endpoint requires authorization, see /tenant endpoint and signIn() mutation'
							)
						}

						if (!ctx.state.authResult.valid) {
							throw new AuthenticationError(`Auth failure: ${ctx.state.authResult.error}`)
						}
						await knexConnection
							.wrapper()
							.raw('SELECT set_config(?, ?, false)', 'tenant.identity_id', ctx.state.authResult.identityId)

						const projectRoles = await this.projectMemberManager.getProjectRoles(
							project.uuid,
							ctx.state.authResult.identityId
						)

						const permissions = new PermissionFactory(stage.schema.model).create(stage.schema.acl, projectRoles.roles)
						const dataSchemaBuilder = projectContainer
							.get('graphQlSchemaBuilderFactory')
							.create(stage.schema.model, permissions)
						const dataSchema = dataSchemaBuilder.build()

						const apolloKoa = new Koa()
						const server = this.createApolloServer(dataSchema)
						server.applyMiddleware({
							app: apolloKoa,
							path: '/',
							disableHealthCheck: true,
							cors: false,
							bodyParserConfig: false,
						})

						await koaCompose(apolloKoa.middleware)(ctx, next)
					})
				})

				await koaCompose(contentKoa.middleware)(ctx, next)
			}
		)
	}

	private createApolloServer(dataSchema: GraphQLSchema) {
		return new ApolloServer({
			schema: dataSchema,
			uploads: false,
			context: async ({ ctx }: { ctx: Koa.Context }): Promise<Context> => {
				return {
					db: ctx.state.db,
					identityVariables: {}, ///todo by identity
				}
			},
			playground: false,
		})
	}
}

export default ContentMiddlewareFactory
