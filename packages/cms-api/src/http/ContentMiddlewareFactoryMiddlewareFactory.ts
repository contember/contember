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
import * as koaCompose from 'koa-compose'
import { ContextWithRequest } from '../core/koa/router'

class ContentMiddlewareFactoryMiddlewareFactory {
	constructor(
		private projectContainers: Array<
			Container<{
				project: Project
				knexConnection: Knex
				graphQlSchemaBuilderFactory: GraphQlSchemaBuilderFactory
			}>
		>
	) {}

	create(): koaCompose.Middleware<ContentMiddlewareFactoryMiddlewareFactory.ContextWithContentMiddleware> {
		return async (ctx: AuthMiddlewareFactory.ContextWithAuth & ContextWithRequest, next) => {
			const projectContainer = this.projectContainers.find(projectContainer => {
				return projectContainer.get('project').slug === ctx.state.params.projectSlug
			})

			if (projectContainer === undefined) {
				ctx.throw(404, `Project ${ctx.state.params.projectSlug} NOT found`)
				return
			}

			const project = projectContainer.get('project')
			const db = projectContainer.get('knexConnection')

			const stage = project.stages.find(stage => stage.slug === ctx.state.params.stageSlug)

			if (stage === undefined) {
				ctx.throw(404, `Stage ${ctx.state.params.stageSlug} NOT found`)
				return
			}

			const permissions = new AllowAllPermissionFactory().create(stage.schema.model)
			const dataSchemaBuilder = projectContainer
				.get('graphQlSchemaBuilderFactory')
				.create(stage.schema.model, permissions) // TODO: should also depend on identityId
			const dataSchema = dataSchemaBuilder.build()

			const contentKoa = new Koa()
			const contentApollo = new ApolloServer({
				schema: dataSchema,
				context: (): Context => {
					if (ctx.state.authResult === undefined) {
						throw new AuthenticationError(
							'/content endpoint requires authorization, see /tenant endpoint and signIn() mutation'
						)
					}

					if (!ctx.state.authResult.valid) {
						throw new AuthenticationError(`Auth failure: ${ctx.state.authResult.error}`)
					}

					const knexConnection = new KnexConnection(db, 'stage_' + stage.slug)
					return {
						db: knexConnection,
						identityId: ctx.state.authResult.identityId,
						identityVariables: {}, ///todo by identity
					}
				},
			})

			contentApollo.applyMiddleware({
				app: contentKoa,
				path: ctx.originalUrl,
			})

			ctx.state.contentServer = koaCompose(contentKoa.middleware)
			await next()
		}
	}
}

namespace ContentMiddlewareFactoryMiddlewareFactory {
	export type ContextWithContentMiddleware = Koa.Context & {
		state: {
			contentServer?: Koa.Middleware
		}
	}
}

export default ContentMiddlewareFactoryMiddlewareFactory
