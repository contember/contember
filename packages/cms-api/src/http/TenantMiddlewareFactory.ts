import { ApolloServer } from 'apollo-server-koa'
import Koa from 'koa'
import { route } from '../core/koa/router'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import { graphqlKoa } from 'apollo-server-koa/dist/koaApollo'
import corsMiddleware from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { compose } from '../core/koa/compose'
import { KoaMiddleware } from '../core/koa/types'

export default class TenantMiddlewareFactory {
	constructor(private apolloServer: ApolloServer, private readonly authMiddlewareFactory: AuthMiddlewareFactory) {}

	create(): Koa.Middleware {
		const graphQlMiddleware: KoaMiddleware<any> = async (ctx, next) => {
			await graphqlKoa(this.apolloServer.createGraphQLServerOptions.bind(this.apolloServer))(ctx, next)
		}
		return route(
			'/tenant$',
			compose([corsMiddleware(), bodyParser(), this.authMiddlewareFactory.create(), graphQlMiddleware])
		)
	}
}
