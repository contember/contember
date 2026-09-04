import cluster from 'node:cluster'
import { Logger } from '@contember/logger'

const signals = {
	SIGHUP: 1,
	SIGINT: 2,
	SIGTERM: 15,
}
export type TerminationJob = (args: { signal: keyof typeof signals; code: number }) => Promise<void>

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

export const listenOnProcessTermination = (jobs: TerminationJob[], logger: Logger, finalJobs: TerminationJob[] = []) => {
	const execute = createTerminationExecutor(jobs, finalJobs)
	for (const [signal, code] of Object.entries(signals)) {
		process.on(signal, async () => {
			logger.info(`Process ${process.pid} received a ${signal} signal, executing ${jobs.length + finalJobs.length} termination jobs`)
			await execute({ signal: signal as keyof typeof signals, code })
			logger.info(cluster.isMaster ? `All terminated, exiting` : 'All terminated, exiting a worker')
			process.exit(128 + code)
		})
	}
}
