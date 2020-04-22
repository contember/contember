import { KoaMiddleware } from '../koa'
import { graphqlKoa } from 'apollo-server-koa/dist/koaApollo'
import { SystemServerState } from '../services/SystemServerState'

type InputState = SystemServerState

export const createSystemServerMiddleware = (): KoaMiddleware<InputState> => {
	const systemServerMiddleware: KoaMiddleware<InputState> = async (ctx, next) => {
		const server = ctx.state.systemServerProvider.get()
		await graphqlKoa(server.createGraphQLServerOptions.bind(server))(ctx, next)
	}
	return systemServerMiddleware
}
