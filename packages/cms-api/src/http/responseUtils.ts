import { KoaContext } from '../core/koa/types'

export const createGraphqlInvalidAuthResponse = (ctx: KoaContext<any>, message: string): void => {
	ctx.set('Content-type', 'application/json')
	ctx.status = 500
	ctx.body = JSON.stringify({ errors: [{ message, code: 401 }] })
}
