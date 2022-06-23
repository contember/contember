import cluster, { Worker } from 'cluster'
import { timeout } from './timeout.js'

export const getClusterProcessType = (isClusterMode: boolean) =>
	!isClusterMode ? ProcessType.singleNode : cluster.isMaster ? ProcessType.clusterMaster : ProcessType.clusterWorker

export enum ProcessType {
	singleNode,
	clusterMaster,
	clusterWorker,
}

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

	private state: 'none' | 'initializing' | 'running' | 'terminating' | 'closed' = 'none'

	constructor(
		private readonly workerCount: number,
	) {
	}

	public async start(): Promise<void> {
		if (this.state !== 'none') {
			throw new Error(`Worker manager is ${this.state}`)
		}
		this.state = 'initializing'
		cluster.on('exit', async (worker, code, signal) => {
			if (this.state === 'running' || this.state === 'initializing') {
				// eslint-disable-next-line no-console
				console.log(`Worker ${worker.process.pid} died with signal ${signal}, restarting`)
				await timeout(2000)
				cluster.fork()
			}
		})
		for (let i = 0; i < this.workerCount; i++) {
			const worker = cluster.fork()
			await waitForWorker(worker, 15000)
			if (this.state !== 'initializing') {
				return
			}
		}
		this.state = 'running'
	}

	public async terminate(signal: NodeJS.Signals): Promise<void> {
		if (this.state !== 'running') {
			throw new Error(`Worker manager is ${this.state}`)
		}
		this.state = 'terminating'
		await Promise.allSettled(Array.from(cluster.workers ? Object.values(cluster.workers) : []).map(async it => {
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
		this.state = 'closed'
	}
}
