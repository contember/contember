import { AsyncLocalStorage } from 'async_hooks'

const mutexDeadlockTracker = new AsyncLocalStorage<Set<number>>()

let mutexIdCounter = 1

export class Mutex {
	private mutexId = mutexIdCounter++

	private resolvers: (() => void)[] = []

	private locked = false

	public async execute<T>(cb: () => T): Promise<T> {
		const current = mutexDeadlockTracker.getStore()
		await this.lock(current)
		try {
			const newState = new Set<number>(current)
			newState.add(this.mutexId)
			return await mutexDeadlockTracker.run(newState, async () => cb())
		} finally {
			this.release()
		}
	}

	private lock(currentState?: Set<number>): Promise<void> {
		if (!this.locked) {
			this.locked = true
			return Promise.resolve()
		}
		if (currentState?.has(this.mutexId)) {
			throw new MutexDeadlockError()
		}
		return new Promise(resolve => this.resolvers.push(resolve))
	}

	private release(): void {
		const nextResolver = this.resolvers.shift()
		if (nextResolver) {
			nextResolver()
		} else {
			this.locked = false
		}
	}
}

export class MutexDeadlockError extends Error {

}
