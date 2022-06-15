import { KoaMiddleware } from '../koa'
import { Readable } from 'stream'

type EventTime = { label: string; start: number; duration?: number }

export type Timer = <T>(event: string, cb?: () => T) => Promise<T>

export interface TimerMiddlewareState {
	timer: Timer
}

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

		const emit = () => {
			const eventsDescription = times
				.map(it => `${it.label} T+${it.start}ms ${it.duration !== undefined ? it.duration : '[unknown]'}ms`)
				.join('; ')

			const total = new Date().getTime() - globalStart
			const timeLabel = total > 500 ? 'TIME_SLOW' : 'TIME_OK'
			// eslint-disable-next-line no-console
			console.log(
				`${ctx.request.method} ${ctx.request.url} [${ctx.response.status}] ${ctx.req.connection.remoteAddress} ${timeLabel} ${total}ms (${eventsDescription})`,
			)
		}

		if (ctx.response.body instanceof Readable) {
			const body = ctx.response.body
			const streamTimer = ctx.state.timer('Stream', () => {
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
	return timer
}
