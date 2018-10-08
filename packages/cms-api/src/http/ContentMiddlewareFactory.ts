import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import Container from '../core/di/Container'
import Project from '../tenant-api/Project'
import KnexConnection from '../core/knex/KnexConnection'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import GraphQlSchemaBuilderFactory from '../content-api/graphQLSchema/GraphQlSchemaBuilderFactory'
import { Context } from '../content-api/types'
import AllowAllPermissionFactory from '../acl/AllowAllPermissionFactory'
import * as Knex from 'knex'
import * as Koa from 'koa'
import { ContextWithRequest, route } from '../core/koa/router'

class ContentMiddlewareFactory {
	constructor(
		private projectContainers: Array<
			Container<{
				project: Project
				knexConnection: Knex
				graphQlSchemaBuilderFactory: GraphQlSchemaBuilderFactory
			}>
		>
	) {}

	create(): Koa.Middleware {
		return route(
			'/content/:projectSlug/:stageSlug$',
			async (ctx: AuthMiddlewareFactory.ContextWithAuth & ContextWithRequest, next) => {
				const projectContainer = this.projectContainers.find(projectContainer => {
					return projectContainer.get('project').slug === ctx.state.params.projectSlug
				})

				if (projectContainer === undefined) {
					return ctx.throw(404, `Project ${ctx.state.params.projectSlug} NOT found`)
				}

				const project = projectContainer.get('project')
				const db = projectContainer.get('knexConnection')

				const stage = project.stages.find(stage => stage.slug === ctx.state.params.stageSlug)

				if (stage === undefined) {
					return ctx.throw(404, `Stage ${ctx.state.params.stageSlug} NOT found`)
				}

				const permissions = new AllowAllPermissionFactory().create(stage.schema.model)
				const dataSchemaBuilder = projectContainer
					.get('graphQlSchemaBuilderFactory')
					.create(stage.schema.model, permissions) // TODO: should also depend on identityId
				const dataSchema = dataSchemaBuilder.build()

				const contentKoa = new Koa()

				contentKoa.use(async (ctx, next) => {
					await db.transaction(async trx => {
						ctx.state.db = new KnexConnection(trx, 'stage_' + stage.slug)
						await next()
					})
				})

				const contentApollo = new ApolloServer({
					schema: dataSchema,
					context: async ({ ctx }: { ctx: Koa.Context }): Promise<Context> => {
						if (ctx.state.authResult === undefined) {
							throw new AuthenticationError(
								'/content endpoint requires authorization, see /tenant endpoint and signIn() mutation'
							)
						}

						if (!ctx.state.authResult.valid) {
							throw new AuthenticationError(`Auth failure: ${ctx.state.authResult.error}`)
						}
						await ctx.state.db
							.wrapper()
							.raw('SELECT set_config(?, ?, false)', 'tenant.identity_id', ctx.state.authResult.identityId)

						return {
							db: ctx.state.db,
							identityVariables: {}, ///todo by identity
						}
					},
				})

				contentApollo.applyMiddleware({
					app: contentKoa,
					path: '/',
				})

				await route('/', contentKoa)(ctx, next)
			}
		)
	}
}

export default ContentMiddlewareFactory
