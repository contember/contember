import { Runnable, RunnableArgs, Running } from './Runnable'
import { abortableTimeout } from './utils'

export type SupervisorOptions = {
	max?: number
	startupMax?: number
	minBackoff?: number
	maxBackoff?: number
	exponentiationBase?: number
}

export class Supervisor implements Runnable {
	constructor(
		private runnable: Runnable,
		private options: SupervisorOptions = {},
	) {
	}

	public async run(args: RunnableArgs): Promise<Running> {
		const { logger, onError } = args
		let restartCount = 0
		const abortController = new AbortController()
		let innerRunning: Running | undefined
		let wasHealthy = false

		await new Promise<void>(async (resolve, reject) => {
			while (!abortController.signal.aborted) {
				try {
					await new Promise<void>(async (resolveRunning, rejectRunning) => {
						try {
							innerRunning = await this.runnable.run({
								onClose: resolveRunning,
								onError: rejectRunning,
								logger: logger.child({ runningId: Math.random().toString().substring(2) }),
							})
							restartCount = 0
							resolve()
							wasHealthy = true
						} catch (e) {
							rejectRunning(e)
						}
					})
				} catch (e) {
					innerRunning = undefined
					const shouldRestart = wasHealthy
						? (this.options.max === undefined || restartCount++ < this.options.max)
						: (restartCount++ < (this.options.startupMax ?? 10))
					if (shouldRestart) {
						const timeoutMs = Math.ceil(Math.min(
							Math.pow(this.options.exponentiationBase ?? 2, restartCount - 1) * (this.options.minBackoff ?? 1_000),
							this.options.maxBackoff ?? 60_000,
						))
						logger.error(`Runnable crashed, restarting in ${timeoutMs} ms ...`, {
							error: e,
						})
						await abortableTimeout(timeoutMs, abortController.signal)
						if (!abortController.signal.aborted) {
							logger.info(`Restarting runnable now`)
						}
					} else {
						logger.error(`Runnable crashed, stopping`, {
							error: e,
						})
						if (wasHealthy) {
							onError(e)
						} else {
							reject(e)
						}
						return
					}
				}
			}
		})

		return {
			async end(): Promise<void> {
				abortController.abort()
				await innerRunning?.end()
			},
		}
	}
}
