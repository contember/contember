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
