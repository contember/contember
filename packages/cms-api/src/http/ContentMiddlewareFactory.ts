import { ApolloServer } from 'apollo-server-koa'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import { Context } from '../content-api/types'
import * as Koa from 'koa'
import * as koaCompose from 'koa-compose'
import { ContextWithRequest, route } from '../core/koa/router'
import * as corsMiddleware from '@koa/cors'
import * as bodyParser from 'koa-bodyparser'
import PlaygroundMiddlewareFactory from './PlaygroundMiddlewareFactory'
import { ProjectContainer } from '../CompositionRoot'
import ProjectMemberManager from '../tenant-api/model/service/ProjectMemberManager'
import { GraphQLSchema } from 'graphql'
import TimerMiddlewareFactory from './TimerMiddlewareFactory'
import { Acl, Model } from 'cms-common'
import KnexWrapper from '../core/knex/KnexWrapper'
import { setupSystemVariables } from '../system-api/SystemVariablesSetupHelper'
import ExecutionContainerFactory from '../content-api/graphQlResolver/ExecutionContainerFactory'

type KoaContext = AuthMiddlewareFactory.ContextWithAuth &
	ContextWithRequest &
	TimerMiddlewareFactory.ContextWithTimer & { state: { db: KnexWrapper } }
class ContentMiddlewareFactory {
	constructor(private projectContainers: ProjectContainer[], private projectMemberManager: ProjectMemberManager) {}

	create(): Koa.Middleware {
		return route('/content/:projectSlug/:stageSlug$', async (ctx: KoaContext, next) => {
			ctx.state.timer('content route')
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
			ctx.state.db = new KnexWrapper(db, 'stage_' + stage.slug)

			const contentKoa = new Koa()

			contentKoa.use(new PlaygroundMiddlewareFactory().create())
			contentKoa.use(corsMiddleware())
			contentKoa.use(bodyParser())

			contentKoa.use(
				async (
					ctx: AuthMiddlewareFactory.ContextWithAuth & {
						state: { db: KnexWrapper }
					} & TimerMiddlewareFactory.ContextWithTimer,
					next
				) => {
					const createGraphqlInvalidAuthResponse = (message: string): void => {
						ctx.set('Content-type', 'application/json')
						ctx.status = 500
						ctx.body = JSON.stringify({ errors: [{ message, code: 401 }] })
					}
					ctx.state.timer('starting trx')
					await ctx.state.db.transaction(async knexConnection => {
						ctx.state.timer('done')
						ctx.state.db = knexConnection
						if (ctx.state.authResult === undefined) {
							return createGraphqlInvalidAuthResponse(
								'/content endpoint requires authorization, see /tenant endpoint and signIn() mutation'
							)
						}

						if (!ctx.state.authResult.valid) {
							return createGraphqlInvalidAuthResponse(`Auth failure: ${ctx.state.authResult.error}`)
						}
						await setupSystemVariables(knexConnection, ctx.state.authResult.identityId)

						ctx.state.timer('fetching project roles and variables')

						const [projectRoles, projectVariables] = await Promise.all([
							this.projectMemberManager.getProjectRoles(project.uuid, ctx.state.authResult.identityId),
							this.projectMemberManager.getProjectVariables(project.uuid, ctx.state.authResult.identityId),
						])

						ctx.state.timer('done')

						ctx.state.timer('building schema')

						const globalRoles = ctx.state.authResult.roles
						const [dataSchema, permissions] = projectContainer.get('graphQlSchemaFactory').create(stage.schema, {
							projectRoles: projectRoles.roles,
							globalRoles: globalRoles,
						})

						ctx.state.timer('done')

						const apolloKoa = new Koa()
						const server = this.createApolloServer(dataSchema, projectVariables, stage.schema.model, permissions)
						server.applyMiddleware({
							app: apolloKoa,
							path: '/',
							disableHealthCheck: true,
							cors: false,
							bodyParserConfig: false,
						})

						ctx.state.timer('running graphql')
						await koaCompose(apolloKoa.middleware)(ctx, next)
						ctx.state.timer('done')
					})
				}
			)

			await koaCompose(contentKoa.middleware)(ctx, next)
		})
	}

	private createApolloServer(dataSchema: GraphQLSchema, variables: Acl.VariablesMap, schema: Model.Schema, permissions: Acl.Permissions) {
		return new ApolloServer({
			tracing: true,
			schema: dataSchema,
			uploads: false,
			context: async ({ ctx }: { ctx: Koa.Context }): Promise<Context> => {
				const executionContainer = new ExecutionContainerFactory(schema, permissions).create({
					db: ctx.state.db,
					identityVariables: variables,
				})
				return {
					db: ctx.state.db,
					identityVariables: variables,
					executionContainer
				}
			},
			playground: false,
		})
	}
}

export default ContentMiddlewareFactory
