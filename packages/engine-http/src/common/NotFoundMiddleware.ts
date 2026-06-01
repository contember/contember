import { KoaMiddleware } from '../application/types.js'
import { HttpErrorResponse } from './HttpResponse.js'

/**
 * Terminal Koa middleware that responds with a consistent JSON error envelope
 * (`{"errors":[{"message":"Route not found","code":404}]}`) instead of Koa's
 * default plain-text `Not Found` body for unmatched routes.
 */
export const createNotFoundMiddleware = (): KoaMiddleware<any> => {
	return async ctx => {
		const response = new HttpErrorResponse(404, 'Route not found')
		ctx.status = response.code
		if (response.contentType) {
			ctx.set('Content-type', response.contentType)
		}
		ctx.body = response.body
	}
}
