import { Key, pathToRegexp } from 'path-to-regexp'
import { KoaContext, KoaMiddleware } from './types'
import { AuthResult, HttpErrorResponse, HttpResponse } from '../common'
import Koa from 'koa'
import * as http from 'http'
import { IncomingMessage, ServerResponse } from 'http'
import { WebSocketServer } from 'ws'
import { FingerCrossedLoggerHandler, Logger } from '@contember/logger'
import koaCompress from 'koa-compress'
import bodyParser from 'koa-bodyparser'
import { ServerConfig } from '../config/config'
import corsMiddleware from '@koa/cors'
import { Readable } from 'stream'
import { ProjectGroupResolver } from '../projectGroup/ProjectGroupResolver'
import { ProjectGroupContainer } from '../projectGroup/ProjectGroupContainer'


export class Application {

	private middlewares: KoaMiddleware<any>[] = []

	private routes: { match: RequestMatcher; controller: HttpController; module: string }[] = []

	constructor(
		private readonly projectGroupResolver: ProjectGroupResolver,
		private readonly serverConfig: ServerConfig,
		private readonly debugMode: boolean,
		private readonly version: string | undefined,
		private readonly logger: Logger,
	) {
	}

	addMiddleware(middleware: KoaMiddleware<any>) {
		this.middlewares.push(middleware)
	}


	public addRoute(module: string, mask: string, controller: HttpController): void {
		this.routes.push({
			module,
			controller,
			match: createRequestMatcher(mask),
		})
	}

	listen: http.Server['listen'] = (...args) => {
		const koa = new Koa()
		const ws = new WebSocketServer({ noServer: true })
		for (const middleware of this.middlewares) {
			koa.use(middleware)
		}
		koa.use(koaCompress({
			br: false,
		}))
		koa.use(bodyParser({
			jsonLimit: this.serverConfig.http.requestBodySize || '1mb',
		}))
		koa.use(corsMiddleware())
		const versionMatch = this.version?.match(/^(0\.\d+|\d+)/)
		const versionSimplified = versionMatch?.[1] ?? 'unknown'
		koa.use(async ctx => {
			ctx.response.set('X-Powered-By', `Contember ${versionSimplified}` + (this.debugMode ? '-dev' : ''))
			await this.handleHttpRequest(ctx)
		})

		const server = http.createServer(koa.callback())

		// server.on('upgrade', (req, socket, head) => {
		// 	ws.handleUpgrade()
		// })
		return server.listen(...(args as any))
	}

	private async handleHttpRequest(ctx: KoaContext<{module?: string}>) {
		let httpContext: HttpContext | null = null
		let requestLogger = this.logger
		const { timer, send: sendTimer } = this.createTimer(requestLogger)
		try {
			const matchedRequest = this.matchRequest(ctx.request)
			if (!matchedRequest) {
				throw new HttpErrorResponse(404, 'Route not found')
			}
			requestLogger = this.createRequestLogger(ctx.req, ctx.request.body, matchedRequest.module)
			requestLogger.debug('Request processing started', {
				body: ctx.request.body,
				query: ctx.request.query,
			})

			// todo: solve without koa context (required by prom metrics)
			ctx.state.module = matchedRequest.module

			const groupContainer = await this.projectGroupResolver.resolveContainer({ request: ctx.req })
			const authResult = await groupContainer.authenticator.authenticate({ request: ctx.req, timer })
			requestLogger.debug('User authenticated', { authResult })
			requestLogger = requestLogger.child({
				user: authResult?.identityId,
			})


			const response = await requestLogger.scope(async logger => {
				httpContext = {
					koa: ctx,
					body: ctx.request.body,
					path: ctx.request.path,
					logger,
					timer,
					request: ctx.req,
					response: ctx.res,
					requestDebugMode: false,
					authResult,
					params: matchedRequest.params,
					projectGroup: groupContainer,
				}
				requestLogger = logger
				return await matchedRequest.controller(httpContext)
			})
			if (response) {
				this.sendHttpResponse(ctx, response)
			}
		} catch (e) {
			if (e instanceof HttpResponse) {
				this.sendHttpResponse(ctx, e)
			} else {
				this.sendHttpResponse(ctx, new HttpErrorResponse(500, 'Internal server error'))
				requestLogger.error(e)
			}
		} finally {
			sendTimer({
				response: ctx.res,
				body: ctx.response.body,
				requestDebugMode: (httpContext as HttpContext | null)?.requestDebugMode ?? false,
			})
			requestLogger.debug('Request processing finished')
		}
	}

	private sendHttpResponse(ctx: KoaContext<{}>, response: HttpResponse) {
		if (response.contentType) {
			ctx.set('Content-type', response.contentType)
		}
		ctx.status = response.code
		if (response.body !== undefined) {
			ctx.body = response.body
		}
	}

	private createRequestLogger(request: IncomingMessage, body: any, module: string): Logger {
		return this.logger.child({
			method: request.method,
			uri: request.url,
			requestId: Math.random().toString().substring(2),
			module,
			[LoggerRequestBody]: body,
		}, {
			handler: FingerCrossedLoggerHandler.factory(),
		})
	}

	private createTimer(logger: Logger) {
		const times: EventTime[] = []
		const globalStart = new Date().getTime()
		const timer: Timer = async (name: string, cb) => {
			if (!cb) {
				times.push({ label: name, start: new Date().getTime() - globalStart })
				return
			}

			const start = new Date().getTime()
			const time: EventTime = { label: name, start: start - globalStart }
			times.push(time)
			const res = await cb()
			time.duration = new Date().getTime() - start
			return res as any
		}

		const send = (ctx: { response: ServerResponse; body: unknown; requestDebugMode: boolean }) => {
			if (!ctx.response.headersSent && (ctx.requestDebugMode || this.debugMode) && times.length) {
				ctx.response.setHeader('server-timing', times.map(it => `${it.label};desc="${it.label} T+${it.start}";dur=${it.duration ?? -1}`).join(', '))
			}

			const emit = () => {
				const total = new Date().getTime() - globalStart
				const timeLabel = total > 500 ? 'TIME_SLOW' : 'TIME_OK'
				logger.info(ctx.response.statusCode < 400 ? `Request successful` : 'Request failed', {
					status: ctx.response.statusCode,
					timeLabel: timeLabel,
					totalTimeMs: total,
					events: times,
				})
			}

			if (ctx.body instanceof Readable) {
				const body = ctx.body
				const streamTimer = timer('Stream', () => {
					return new Promise(resolve => {
						body.addListener('close', () => {
							resolve(null)
						})
					})
				})

				streamTimer.then(emit).catch(emit)

			} else {
				emit()
			}

		}
		return { timer, send }
	}

	private matchRequest(request: { path: string; method: string }): { params: Params; controller: HttpController; module: string } | null {
		for (const route of this.routes) {
			const params = route.match(request)
			if (params !== null) {
				return { params, controller: route.controller, module: route.module }
			}
		}
		return null
	}
}


type EventTime = { label: string; start: number; duration?: number }

export type Timer = <T>(event: string, cb?: () => T) => Promise<T>

export interface ApplicationContext {
	logger: Logger
	timer: Timer
	request: IncomingMessage
	path: string

	projectGroup: ProjectGroupContainer
	authResult: AuthResult | null
	params: Params

	requestDebugMode: boolean
}

export interface HttpContext extends ApplicationContext {
	koa: KoaContext<{}>
	body: unknown
	response: ServerResponse
}

export interface WebSocketContext {

}

export type HttpController = (context: HttpContext) => Promise<HttpErrorResponse | undefined | void> | HttpErrorResponse | undefined | void

type Params = { [param: string]: string }

type RequestMatcher = (args: { path: string; method: string }) => Params | null
const createRequestMatcher = (
	mask: string,
): RequestMatcher => {
	const keys: Key[] = []
	const regexp: RegExp = pathToRegexp(mask, keys)

	const match = function (url: string): Params | null {
		const match = regexp.exec(url)
		if (match) {
			return match.slice(1).reduce((acc, value, i) => ({ ...acc, [keys[i].name]: value }), {})
		}
		return null
	}

	return request => {
		return match(request.path)
	}
}

export const LoggerRequestBody = Symbol('RequestBody')
