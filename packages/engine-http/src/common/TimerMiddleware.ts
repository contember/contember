import { KoaMiddleware } from '../koa'
import { Readable } from 'stream'
import { LoggerMiddlewareState } from './LoggerMiddleware'

type EventTime = { label: string; start: number; duration?: number }

export type Timer = <T>(event: string, cb?: () => T) => Promise<T>

export interface TimerMiddlewareState {
	timer: Timer
	sendServerTimingHeader: boolean
}

export const createTimerMiddleware = ({ debugMode }: { debugMode: boolean }): KoaMiddleware<TimerMiddlewareState & LoggerMiddlewareState> => {
	const timer: KoaMiddleware<TimerMiddlewareState & LoggerMiddlewareState> = async (ctx, next) => {
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

		if (!ctx.headerSent && (ctx.state.sendServerTimingHeader || debugMode) && times.length) {
			ctx.response.set('server-timing', times.map(it => `${it.label};desc="${it.label} T+${it.start}";dur=${it.duration ?? -1}`).join(', '))
		}


		const emit = () => {
			const total = new Date().getTime() - globalStart
			const timeLabel = total > 500 ? 'TIME_SLOW' : 'TIME_OK'
			ctx.state.logger.info(ctx.response.status < 400 ? `Request successful` : 'Request failed', {
				status: ctx.response.status,
				timeLabel: timeLabel,
				totalTimeMs: total,
				events: times,
			})
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
