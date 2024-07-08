import cluster, { Worker } from 'node:cluster'
import { timeout } from './utils'

export const getClusterProcessType = (isClusterMode: boolean): ProcessType =>
	!isClusterMode ? 'singleNode' : cluster.isMaster ? 'clusterMaster' : 'clusterWorker'

export type ProcessType =
	| 'singleNode'
	| 'clusterMaster'
	| 'clusterWorker'

const MSG_WORKER_STARTED = 'msg_worker_started'

export const waitForWorker = (worker: Worker, timeoutMs: number) => {
	let ok = false
	return Promise.race([
		new Promise(async resolve => {
			const listener = (message: any) => {
				if ('type' in message && message.type === MSG_WORKER_STARTED) {
					ok = true
					resolve(null)
					worker.removeListener('message', listener)
				}
			}
			await worker.on('message', listener)
		}),
		timeout(timeoutMs).then(() => {
			if (!ok) {
				throw new Error('Worker start timed out')
			}
			return true
		}),
	])
}

export const notifyWorkerStarted = () =>
	process.send?.({
		type: MSG_WORKER_STARTED,
	})

export class WorkerManager {

	private isTerminating = false

	private workers: Set<Worker> = new Set()

	public async start({ workerCount, env }: { workerCount: number; env?: any }): Promise<void> {
		if (this.isTerminating) {
			throw new Error(`Worker manager is terminating`)
		}
		for (let i = 0; i < workerCount; i++) {
			await this.startWorker(env)
			if (this.isTerminating) {
				return
			}
		}
	}

	private async startWorker(env?: any) {
		const worker = cluster.fork(env)
		worker.on('exit', async (code, signal) => {
			this.workers.delete(worker)
			if (!this.isTerminating) {
				// eslint-disable-next-line no-console
				console.log(`Worker ${worker.process.pid} died with signal ${signal}, restarting`)
				await timeout(2000)
				await this.startWorker(env)
			}
		})
		this.workers.add(worker)
		await waitForWorker(worker, 15000)
	}

	public async terminate(signal: NodeJS.Signals): Promise<void> {
		if (this.isTerminating) {
			throw new Error(`Worker manager is terminating`)
		}
		this.isTerminating = true
		await Promise.allSettled(Array.from(this.workers).map(async it => {
			if (!it) {
				return
			}
			// eslint-disable-next-line no-console
			console.log(`Terminating worker ${it.process.pid}`)
			const disconnectPromise = new Promise(resolve => it.once('disconnect', resolve))
			it.disconnect()
			await disconnectPromise
			const killPromise = new Promise(resolve => it.once('exit', resolve))
			it.kill(signal)
			await killPromise
			// eslint-disable-next-line no-console
			console.log(`Worker ${it.process.pid} terminated`)
		}))
	}
}
