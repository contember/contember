import * as pathToRegexp from 'path-to-regexp'
import * as compose from 'koa-compose'
import * as Koa from 'koa'

type Params = { [param: string]: string }
type ContextWithRequest = Koa.Context & {
	state: {
		route: string
		params: Params
	}
}

function createRoutingMiddleware(
	method: string | undefined,
	mask: string,
	app: Koa | Koa.Middleware
): compose.Middleware<ContextWithRequest> {
	const downstream = app instanceof Koa ? compose(app.middleware) : app

	return async (ctx: Koa.Context, upstream) => {
		const prev = ctx.path
		if (method && ctx.req.method !== method) {
			return await upstream()
		}

		const exact = mask.slice(-1) === '$'
		const params = matchesPath(exact ? mask.slice(0, -1) : mask + ':__path(.*)', prev)
		if (params === null) {
			return await upstream()
		}

		ctx.state.route = mask
		ctx.state.params = params
		ctx.path = params.__path || '/'

		await downstream(ctx, async () => {
			ctx.path = prev
			await upstream()
			ctx.path = params.__path || '/'
		})

		ctx.path = prev
	}
}

function matchesPath(path: string, url: string): Params | null {
	let keys: pathToRegexp.Key[] = []
	let regexp: RegExp = pathToRegexp(path, keys)
	const match = regexp.exec(url)
	if (match) {
		return match.slice(1).reduce((acc, value, i) => ({ ...acc, [keys[i].name]: value }), {})
	}
	return null
}

function route(mask: string, appOrMiddleWare: Koa | Koa.Middleware): compose.Middleware<ContextWithRequest> {
	return createRoutingMiddleware(undefined, mask, appOrMiddleWare)
}

function get(mask: string, appOrMiddleWare: Koa | Koa.Middleware): compose.Middleware<ContextWithRequest> {
	return createRoutingMiddleware('GET', mask, appOrMiddleWare)
}

function post(mask: string, appOrMiddleWare: Koa | Koa.Middleware): compose.Middleware<ContextWithRequest> {
	return createRoutingMiddleware('POST', mask, appOrMiddleWare)
}

export { route, get, post, ContextWithRequest }
