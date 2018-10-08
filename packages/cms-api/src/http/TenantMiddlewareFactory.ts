import { ApolloServer } from 'apollo-server-koa'
import * as Koa from 'koa'
import { route } from '../core/koa/router'

export default class TenantMiddlewareFactory {
	constructor(private apolloServer: ApolloServer) {}

	create(): Koa.Middleware {
		const tenantKoa = new Koa()
		this.apolloServer.applyMiddleware({ app: tenantKoa, path: '/' })

		return route('/tenant$', tenantKoa)
	}
}
