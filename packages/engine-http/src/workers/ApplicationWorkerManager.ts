import { Runnable } from '@contember/engine-common'

export class ApplicationWorkerManager {
	private workers: Record<string, Runnable> = {}

	public registerWorker(name: string, runnable: Runnable) {
		if (this.workers[name]) {
			throw new Error(`Worker ${name} already registered.`)
		}
		this.workers[name] = runnable
	}

	public getWorkerNames(): string[] {
		return Object.keys(this.workers)
	}

	public hasWorker(name: string): boolean {
		return name in this.workers
	}

	public getWorker(name: string): Runnable {
		if (!(name in this.workers)) {
			throw new Error(`Worker ${name} does not exist.`)
		}
		return this.workers[name]
	}
}
