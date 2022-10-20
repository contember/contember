import { Key, pathToRegexp } from 'path-to-regexp'
import { KoaContext, KoaMiddleware } from './types'
import { compose } from './compose'
import { createModuleInfoMiddleware } from '../common'

type Params = { [param: string]: string }
type KoaRequestState = {
	route: string
	params: Params
}
type ContextWithRequest = KoaContext<KoaRequestState>

function createRoutingMiddleware(
	method: string | undefined,
	mask: string,
	middleware: KoaMiddleware<KoaRequestState>,
): KoaMiddleware<KoaRequestState> {
	const downstream = middleware
	const exact = mask.slice(-1) === '$'
	const normalizedMask = exact ? mask.slice(0, -1) : mask + ':__path(.*)'

	const keys: Key[] = []
	const regexp: RegExp = pathToRegexp(normalizedMask, keys)

	const match = function (url: string): Params | null {
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
		let path = params.__path || ''
		if (path.charAt(0) !== '/') {
			path = '/' + path
		}
		ctx.path = path

		await downstream(ctx, async () => {
			ctx.path = prev
			await upstream()
			ctx.path = path
		})

		ctx.path = prev
	}
}

function route(mask: string, middleware: KoaMiddleware<KoaRequestState>): KoaMiddleware<KoaRequestState> {
	return createRoutingMiddleware(undefined, mask, middleware)
}

function get(mask: string, middleware: KoaMiddleware<KoaRequestState>): KoaMiddleware<KoaRequestState> {
	return createRoutingMiddleware('GET', mask, middleware)
}

function post(mask: string, middleware: KoaMiddleware<KoaRequestState>): KoaMiddleware<KoaRequestState> {
	return createRoutingMiddleware('POST', mask, middleware)
}

export { route, get, post, ContextWithRequest, KoaRequestState }

export class Router {
	private middlewares: KoaMiddleware<any>[] = []

	public add(module: string, mark: string, middleware: KoaMiddleware<any>): void {
		this.middlewares.push(route(mark, compose([createModuleInfoMiddleware(module), middleware])))
	}

	public build(): KoaMiddleware<any> {
		return compose(this.middlewares)
	}
}
