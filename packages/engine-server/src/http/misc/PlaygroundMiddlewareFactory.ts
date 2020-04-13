import Koa from 'koa'
import { get } from '../../core/koa'
import {
	RenderPageOptions as PlaygroundRenderPageOptions,
	renderPlaygroundPage,
} from '@apollographql/graphql-playground-html'
import { createPlaygroundOptions } from 'apollo-server-core'
import accepts from 'accepts'

export const createPlaygroundMiddleware = () => {
	return get('/', (ctx: Koa.Context, next) => {
		const accept = accepts(ctx.req)
		const types = accept.types() as string[]
		const prefersHTML = types.find((x: string) => x === 'text/html' || x === 'application/json') === 'text/html'
		if (!prefersHTML) {
			return next()
		}

		const playgroundRenderPageOptions: PlaygroundRenderPageOptions | undefined = createPlaygroundOptions({
			endpoint: ctx.originalUrl,
		})
		if (!playgroundRenderPageOptions) {
			return ctx.throw(404)
		}

		ctx.set('Content-Type', 'text/html')
		ctx.body = renderPlaygroundPage(playgroundRenderPageOptions)
	})
}
