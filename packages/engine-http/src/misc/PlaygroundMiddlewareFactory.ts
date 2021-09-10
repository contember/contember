import {
	RenderPageOptions as PlaygroundRenderPageOptions,
	renderPlaygroundPage,
} from '@apollographql/graphql-playground-html'
import accepts from 'accepts'
import { get, KoaContext, KoaMiddleware, KoaRequestState } from '../koa'

export const createPlaygroundMiddleware = (): KoaMiddleware<KoaRequestState> => {
	return get('/', (ctx: KoaContext<KoaRequestState>, next) => {
		const accept = accepts(ctx.req)
		const types = accept.types() as string[]
		const prefersHTML = types.find((x: string) => x === 'text/html' || x === 'application/json') === 'text/html'
		if (!prefersHTML) {
			return next()
		}
		const playgroundRenderPageOptions: PlaygroundRenderPageOptions = {
			endpoint: ctx.originalUrl,
		}

		ctx.set('Content-Type', 'text/html')
		ctx.body = renderPlaygroundPage(playgroundRenderPageOptions)
	})
}
