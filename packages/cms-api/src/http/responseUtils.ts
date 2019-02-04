import { Context } from 'koa'

export const createGraphqlInvalidAuthResponse = (ctx: Context, message: string): void => {
	ctx.set('Content-type', 'application/json')
	ctx.status = 500
	ctx.body = JSON.stringify({ errors: [{ message, code: 401 }] })
}
