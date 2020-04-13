import pathToRegexp from 'path-to-regexp'
import compose from 'koa-compose'
import Koa from 'koa'
import { KoaContext } from './types'

type Params = { [param: string]: string }
type KoaRequestState = {
	route: string
	params: Params
}
type ContextWithRequest = KoaContext<KoaRequestState>

function createRoutingMiddleware(
	method: string | undefined,
	mask: string,
	middleware: Koa.Middleware,
): compose.Middleware<ContextWithRequest> {
	const downstream = middleware
	const exact = mask.slice(-1) === '$'
	const normalizedMask = exact ? mask.slice(0, -1) : mask + ':__path(.*)'

	const keys: pathToRegexp.Key[] = []
	const regexp: RegExp = pathToRegexp(normalizedMask, keys)

	const match = function(url: string): Params | null {
		const match = regexp.exec(url)
		if (match) {
			return match.slice(1).reduce((acc, value, i) => ({ ...acc, [keys[i].name]: value }), {})
		}
		return null
	}

	return async (ctx: ContextWithRequest, upstream) => {
		const prev = ctx.path
		if (method && ctx.req.method !== method) {
			return await upstream()
		}

		const params = match(prev)
		if (params === null) {
			return await upstream()
		}

		ctx.state.route = mask
		ctx.state.params = params
		ctx.path = params.__path || '/'

		await downstream(ctx as Koa.Context, async () => {
			ctx.path = prev
			await upstream()
			ctx.path = params.__path || '/'
		})

		ctx.path = prev
	}
}

function route(mask: string, middleware: Koa.Middleware): compose.Middleware<ContextWithRequest> {
	return createRoutingMiddleware(undefined, mask, middleware)
}

function get(mask: string, middleware: Koa.Middleware): compose.Middleware<ContextWithRequest> {
	return createRoutingMiddleware('GET', mask, middleware)
}

function post(mask: string, middleware: Koa.Middleware): compose.Middleware<ContextWithRequest> {
	return createRoutingMiddleware('POST', mask, middleware)
}

export { route, get, post, ContextWithRequest, KoaRequestState }
