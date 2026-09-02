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
	/** Jobs that run only after every regular job has settled. */
	readonly finalJobs?: readonly TerminationJob[]
}

export const executeTerminationJobs = async (
	jobs: readonly TerminationJob[],
	finalJobs: readonly TerminationJob[],
	args: Parameters<TerminationJob>[0],
): Promise<void> => {
	await Promise.allSettled(jobs.map(it => Promise.resolve().then(() => it(args))))
	await Promise.allSettled(finalJobs.map(it => Promise.resolve().then(() => it(args))))
}

export const createTerminationExecutor = (jobs: readonly TerminationJob[], finalJobs: readonly TerminationJob[]) => {
	let execution: Promise<void> | undefined
	return (args: Parameters<TerminationJob>[0]): Promise<void> => {
		execution ??= executeTerminationJobs(jobs, finalJobs, args)
		return execution
	}
}

export const listenOnProcessTermination = (
	jobs: TerminationJob[],
	logger: Logger,
	{ sigtermDelayMs = 0, finalJobs = [] }: ProcessTerminationOptions = {},
) => {
	const execute = createTerminationExecutor(jobs, finalJobs)
	for (const [signal, code] of Object.entries(signals)) {
		process.on(signal, async () => {
			if (signal === 'SIGTERM' && sigtermDelayMs > 0) {
				logger.info(`Process ${process.pid} received a SIGTERM signal, serving for another ${sigtermDelayMs} ms before terminating`)
				await new Promise(resolve => setTimeout(resolve, sigtermDelayMs))
			}
			logger.info(`Process ${process.pid} received a ${signal} signal, executing ${jobs.length} termination jobs`)
			await execute({ signal: signal as keyof typeof signals, code })
			logger.info(cluster.isMaster ? `All terminated, exiting` : 'All terminated, exiting a worker')
			process.exit(128 + code)
		})
	}
}
