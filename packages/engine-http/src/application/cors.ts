import { KoaMiddleware } from './types.js'

const allowMethods = 'GET,HEAD,PUT,POST,DELETE,PATCH'

const appendVary = (current: string, field: string): string => {
	const fields = current.split(',').map(it => it.trim().toLowerCase())
	if (fields.includes('*') || fields.includes(field.toLowerCase())) {
		return current
	}
	return current.trim() ? `${current}, ${field}` : field
}

/**
 * Permissive CORS for any origin without credentials. Preflights (OPTIONS with
 * Access-Control-Request-Method) are answered with 204 and echo the requested headers.
 * The CORS headers survive an error thrown by the downstream handler.
 */
export const createCorsMiddleware = ({ exposeHeaders }: { exposeHeaders: readonly string[] }): KoaMiddleware<unknown> => {
	const exposeHeadersValue = exposeHeaders.join(',')

	return async (ctx, next) => {
		ctx.vary('Origin')

		if (ctx.method === 'OPTIONS') {
			if (!ctx.get('Access-Control-Request-Method')) {
				return await next()
			}
			ctx.set('Access-Control-Allow-Origin', '*')
			ctx.set('Access-Control-Allow-Methods', allowMethods)
			const requestHeaders = ctx.get('Access-Control-Request-Headers')
			if (requestHeaders) {
				ctx.set('Access-Control-Allow-Headers', requestHeaders)
			}
			ctx.status = 204
			return
		}

		const corsHeaders: Record<string, string> = { 'Access-Control-Allow-Origin': '*' }
		if (exposeHeadersValue) {
			corsHeaders['Access-Control-Expose-Headers'] = exposeHeadersValue
		}
		ctx.set(corsHeaders)
		try {
			return await next()
		} catch (error) {
			// Koa's error handler resets the response headers and applies `error.headers` instead.
			if (typeof error === 'object' && error !== null) {
				const errorHeaders: unknown = Reflect.get(error, 'headers')
				const headers: Record<string, unknown> = typeof errorHeaders === 'object' && errorHeaders !== null ? { ...errorHeaders } : {}
				const vary = headers.vary ?? headers.Vary
				delete headers.Vary
				Reflect.set(error, 'headers', {
					...headers,
					...corsHeaders,
					vary: appendVary(typeof vary === 'string' ? vary : '', 'Origin'),
				})
			}
			throw error
		}
	}
}
