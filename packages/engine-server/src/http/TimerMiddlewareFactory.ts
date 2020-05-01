import Koa from 'koa'
import { KoaContext } from '../core/koa'

type EventTime = { label: string; start: number; duration?: number }
class TimerMiddlewareFactory {
	public create(): Koa.Middleware {
		return async (ctx: TimerMiddlewareFactory.ContextWithTimer, next) => {
			const times: EventTime[] = []
			const globalStart = new Date().getTime()
			ctx.state.timer = async (name: string, cb) => {
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
			await next()

			const eventsDescription = times
				.map(it => `${it.label} T+${it.start}ms ${it.duration !== undefined ? it.duration : '[unknown]'}ms`)
				.join('; ')
			const total = new Date().getTime() - globalStart
			const timeLabel = total > 500 ? 'TIME_SLOW' : 'TIME_OK'
			console.log(
				`${ctx.request.method} ${ctx.request.url} [${ctx.response.status}] ${ctx.req.connection.remoteAddress} ${timeLabel} ${total}ms (${eventsDescription})`,
			)
		}
	}
}

namespace TimerMiddlewareFactory {
	export type ContextWithTimer = KoaContext<KoaState>

	export type KoaState = {
		timer: <T>(event: string, cb?: () => T | Promise<T>) => Promise<T>
	}
}

export { TimerMiddlewareFactory }
