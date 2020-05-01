import { KoaMiddleware } from '../koa'

type EventTime = { label: string; start: number; duration?: number }
export const createTimerMiddleware = (): KoaMiddleware<TimerMiddlewareState> => {
	const timer: KoaMiddleware<TimerMiddlewareState> = async (ctx, next) => {
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
	return timer
}

export interface TimerMiddlewareState {
	timer: <T>(event: string, cb?: () => T) => Promise<T>
}
