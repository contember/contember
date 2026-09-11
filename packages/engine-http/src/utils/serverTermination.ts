import cluster from 'node:cluster'
import { Logger } from '@contember/logger'

const signals = {
	SIGHUP: 1,
	SIGINT: 2,
	SIGTERM: 15,
}
export type TerminationJob = (args: { signal: keyof typeof signals; code: number }) => Promise<void>

export interface ProcessTerminationOptions {
	/**
	 * How long the process keeps serving after SIGTERM before the jobs run. An orchestrator stops routing to
	 * a process only some time after signalling it, so draining at once refuses what is still on its way.
	 * SIGINT and SIGHUP never wait.
	 */
	readonly sigtermDelayMs?: number
}

export const listenOnProcessTermination = (
	jobs: TerminationJob[],
	logger: Logger,
	{ sigtermDelayMs = 0 }: ProcessTerminationOptions = {},
) => {
	for (const [signal, code] of Object.entries(signals)) {
		process.on(signal, async () => {
			if (signal === 'SIGTERM' && sigtermDelayMs > 0) {
				logger.info(`Process ${process.pid} received a SIGTERM signal, serving for another ${sigtermDelayMs} ms before terminating`)
				await new Promise(resolve => setTimeout(resolve, sigtermDelayMs))
			}
			logger.info(`Process ${process.pid} received a ${signal} signal, executing ${jobs.length} termination jobs`)
			await Promise.allSettled(jobs.map(it => it({ signal: signal as keyof typeof signals, code })))
			logger.info(cluster.isMaster ? `All terminated, exiting` : 'All terminated, exiting a worker')
			process.exit(128 + code)
		})
	}
}
