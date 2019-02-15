import * as Koa from 'koa'

class TimerMiddlewareFactory {
	public create(): Koa.Middleware {
		return async (ctx: TimerMiddlewareFactory.ContextWithTimer, next) => {
			const times: [string, Date][] = []
			const start = new Date()
			ctx.state.timer = (name: string) => {
				times.push([name, new Date()])
			}
			ctx.state.timer('starting')
			await next()
			ctx.state.timer('all done')

			for (let [name, time] of times) {
				console.log(`Event ${name}: T+${time.getTime() - start.getTime()}ms`)
			}
			const used = process.memoryUsage() as any
			for (let key in used) {
				console.log(`${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`)
			}
		}
	}
}

namespace TimerMiddlewareFactory {
	export type ContextWithTimer = Pick<Koa.Context, Exclude<keyof Koa.Context, 'state'>> & {
		state: {
			timer: (event: string) => void
		}
	}
}

export default TimerMiddlewareFactory
