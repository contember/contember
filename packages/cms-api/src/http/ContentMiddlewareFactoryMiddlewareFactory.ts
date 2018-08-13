import { RequestHandler, Response } from 'express'
import { ApolloServer, AuthenticationError } from 'apollo-server-express'
import * as express from 'express'
import Container from '../core/di/Container'
import Project from '../tenant-api/Project'
import KnexConnection from '../core/knex/KnexConnection'
import GraphQlSchemaBuilder from '../content-api/graphQLSchema/GraphQlSchemaBuilder'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import { Context } from '../content-api/types'

class ContentMiddlewareFactoryMiddlewareFactory {
	constructor(private projectContainers: Array<Container<{ project: Project; knexConnection: KnexConnection }>>) {}

	create(): RequestHandler {
		return (req, res: AuthMiddlewareFactory.ResponseWithAuthResult, next) => {
			const projectContainer = this.projectContainers.find(projectContainer => {
				return projectContainer.get('project').slug === req.params.projectSlug
			})

			if (projectContainer === undefined) {
				res.status(404).send(`Project ${req.params.projectSlug} NOT found`)
				next()
				return
			}

			const project = projectContainer.get('project')
			const db = projectContainer.get('knexConnection')

			const stage = project.stages.find(stage => stage.slug === req.params.stageSlug)

			if (stage === undefined) {
				res.status(404).send(`Stage ${req.params.stageSlug} NOT found`)
				next()
				return
			}

			const dataSchemaBuilder = new GraphQlSchemaBuilder(stage.schema.model) // TODO: should also depend on identityId
			const dataSchema = dataSchemaBuilder.build()

			const contentExpress = express()
			const contentApollo = new ApolloServer({
				schema: dataSchema,
				context: (): Context => {
					if (res.locals.authResult === undefined) {
						throw new AuthenticationError(
							'/content endpoint requires authorization, see /tenant endpoint and signIn() mutation'
						)
					}

					if (!res.locals.authResult.valid) {
						throw new AuthenticationError(`Auth failure: ${res.locals.authResult.error}`)
					}

					return {
						db: db,
						identityId: res.locals.authResult.identityId
					}
				}
			})

			contentApollo.applyMiddleware({
				app: contentExpress,
				path: req.originalUrl
			})

			res.locals.contentMiddleware = contentExpress
			next()
		}
	}
}

namespace ContentMiddlewareFactoryMiddlewareFactory {
	export type ResponseWithContentMiddleware = Response & {
		locals: {
			contentMiddleware?: RequestHandler
		}
	}
}

export default ContentMiddlewareFactoryMiddlewareFactory
