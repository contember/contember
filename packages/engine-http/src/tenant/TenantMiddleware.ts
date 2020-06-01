import { graphqlKoa } from 'apollo-server-koa/dist/koaApollo'
import corsMiddleware from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { compose, KoaMiddleware, route } from '../koa'
import { createAuthMiddleware, createModuleInfoMiddleware } from '../common'
import { TenantApolloServerState } from '../services'

type KoaState = TenantApolloServerState

export const createTenantMiddleware = () => {
	const graphQlMiddleware: KoaMiddleware<KoaState> = async (ctx, next) => {
		const apolloServer = ctx.state.tenantApolloServer
		await graphqlKoa(apolloServer.createGraphQLServerOptions.bind(apolloServer))(ctx, next)
	}
	return route(
		'/tenant$',
		compose([
			createModuleInfoMiddleware('tenant'),
			corsMiddleware(),
			bodyParser(),
			createAuthMiddleware(),
			graphQlMiddleware,
		]),
	)
}
