import cluster from 'cluster'
import { Logger } from '@contember/logger'

const signals = {
	SIGHUP: 1,
	SIGINT: 2,
	SIGTERM: 15,
}
export type TerminationJob = (args: { signal: keyof typeof signals; code: number }) => Promise<void>
export const listenOnProcessTermination = (jobs: TerminationJob[], logger: Logger) => {
	for (const [signal, code] of Object.entries(signals)) {
		process.on(signal, async () => {
			logger.info(`Process ${process.pid} received a ${signal} signal, executing ${jobs.length} termination jobs`)
			await Promise.allSettled(jobs.map(it => it({ signal: signal as keyof typeof signals, code })))
			logger.info(cluster.isMaster ? `All terminated, exiting` : 'All terminated, exiting a worker')
			process.exit(128 + code)
		})
	}
}
