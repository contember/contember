import Koa from 'koa'
import { KoaContext } from '../core/koa/types'

class TimerMiddlewareFactory {
	public create(): Koa.Middleware {
		return async (ctx: TimerMiddlewareFactory.ContextWithTimer, next) => {
			const times: [string, Date][] = []
			const start = new Date()
			ctx.state.timer = async (name: string, cb) => {
				if (!cb) {
					times.push([name, new Date()])
					return
				}

				const res = await cb()
				times.push([name + ' end', new Date()])
				return res as any
			}
			ctx.state.timer('starting ' + ctx.request.url)
			await next()
			ctx.state.timer('all done')

			for (let [name, time] of times) {
				console.log(`Event ${name}: T+${time.getTime() - start.getTime()}ms`)
			}
			// const used = process.memoryUsage() as any
			// for (let key in used) {
			// 	console.log(`${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`)
			// }
		}
	}
}

namespace TimerMiddlewareFactory {
	export type ContextWithTimer = KoaContext<KoaState>

	export type KoaState = {
		timer: <T>(event: string, cb?: () => T) => Promise<T>
	}
}

export default TimerMiddlewareFactory
