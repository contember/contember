import { ApolloServer } from 'apollo-server-koa'
import Koa from 'koa'
import koaCompose from 'koa-compose'
import { route } from '../core/koa/router'

export default class TenantMiddlewareFactory {
	constructor(private apolloServer: ApolloServer) {}

	create(): Koa.Middleware {
		return route('/tenant$', async (ctx, next) => {
			const tenantKoa = new Koa()
			this.apolloServer.applyMiddleware({
				app: tenantKoa,
				path: '/',
			})
			await koaCompose(tenantKoa.middleware)(ctx, next)
		})
	}
}
