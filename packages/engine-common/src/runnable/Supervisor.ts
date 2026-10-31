import { Runnable, RunnableArgs, Running } from './Runnable.js'
import { abortableTimeout } from './utils.js'

export type SupervisorOptions = {
	max?: number
	startupMax?: number
	minBackoff?: number
	maxBackoff?: number
	exponentiationBase?: number
	/** A restarted run must stay up this long before the backoff resets; a run that crashes sooner counts as a failed restart. */
	stableAfterMs?: number
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
		let startedAt: number | undefined
		const endRun = () => {
			if (startedAt !== undefined && Date.now() - startedAt >= (this.options.stableAfterMs ?? 60_000)) {
				restartCount = 0
			}
			startedAt = undefined
		}

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
							if (!wasHealthy) {
								restartCount = 0
							}
							startedAt = Date.now()
							resolve()
							wasHealthy = true
						} catch (e) {
							rejectRunning(e)
						}
					})
					endRun()
				} catch (e) {
					innerRunning = undefined
					endRun()
					restartCount++
					const restartLimit = wasHealthy ? this.options.max : (this.options.startupMax ?? 10)
					const shouldRestart = restartLimit === undefined || restartCount <= restartLimit
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
