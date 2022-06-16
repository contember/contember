/// <reference types="node" />
import { Worker } from 'cluster'
export declare const getClusterProcessType: (isClusterMode: boolean) => ProcessType
export declare enum ProcessType {
	singleNode = 0,
	clusterMaster = 1,
	clusterWorker = 2
}
export declare const waitForWorker: (worker: Worker, timeoutMs: number) => Promise<unknown>
export declare const notifyWorkerStarted: () => boolean | undefined
export declare class WorkerManager {
	private readonly workerCount
	private state
	constructor(workerCount: number)
	start(): Promise<void>
	terminate(signal: NodeJS.Signals): Promise<void>
}
//# sourceMappingURL=cluster.d.ts.map
