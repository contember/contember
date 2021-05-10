import cluster from 'cluster'
import { timeout } from './timeout'

export const getClusterProcessType = (isClusterMode: boolean) =>
	!isClusterMode ? ProcessType.singleNode : cluster.isMaster ? ProcessType.clusterMaster : ProcessType.clusterWorker

export enum ProcessType {
	singleNode,
	clusterMaster,
	clusterWorker,
}

const MSG_WORKER_STARTED = 'msg_worker_started'

export const waitForWorker = (timeoutMs: number) => {
	let ok = false
	return Promise.race([
		new Promise(async resolve => {
			const listener = ({}, message: any) => {
				if ('type' in message && message.type === MSG_WORKER_STARTED) {
					ok = true
					resolve(null)
					cluster.removeListener('message', listener)
				}
			}
			await cluster.on('message', listener)
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
