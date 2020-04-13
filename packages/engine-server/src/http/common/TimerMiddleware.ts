import { KoaMiddleware } from '../../core/koa'

export const createTimerMiddleware = (): KoaMiddleware<TimerMiddlewareState> => {
	const timer: KoaMiddleware<TimerMiddlewareState> = async (ctx, next) => {
		const times: [string, Date][] = []
		const start = new Date()
		ctx.state.timer = async (name: string, cb) => {
			if (!cb) {
				times.push([name, new Date()])
				return
			}

			times.push([name, new Date()])
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
	return timer
}

export interface TimerMiddlewareState {
	timer: <T>(event: string, cb?: () => T) => Promise<T>
}
