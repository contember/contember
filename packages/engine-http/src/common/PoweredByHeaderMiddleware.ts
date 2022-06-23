import { KoaMiddleware } from '../koa/index.js'

export const createPoweredByHeaderMiddleware = (debug: boolean, version: string): KoaMiddleware<{}> => {
	const versionMatch = version.match(/^(0\.\d+|\d+)/)
	const versionSimplified = versionMatch?.[1] ?? 'unknown'

	const poweredByMiddleware: KoaMiddleware<{}> = (ctx, next) => {
		ctx.response.set('X-Powered-By', `Contember ${versionSimplified}` + (debug ? '-dev' : ''))
		return next()
	}
	return poweredByMiddleware
}
