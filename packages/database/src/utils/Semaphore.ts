/**
 * A counting semaphore with a FIFO waiting queue.
 *
 * Limits the number of concurrently running operations to a fixed number of slots.
 * Callers acquire a slot via {@link Semaphore.execute}; if all slots are taken, the
 * caller waits until a slot is released.
 */
export class Semaphore {
	private available: number

	private readonly queue: (() => void)[] = []

	constructor(
		private readonly maxConcurrency: number,
	) {
		if (maxConcurrency < 1) {
			throw new Error('Semaphore concurrency must be at least 1')
		}
		this.available = maxConcurrency
	}

	public async execute<T>(cb: () => T | Promise<T>): Promise<T> {
		await this.acquire()
		try {
			return await cb()
		} finally {
			this.release()
		}
	}

	private acquire(): Promise<void> {
		if (this.available > 0) {
			this.available--
			return Promise.resolve()
		}
		return new Promise<void>(resolve => {
			this.queue.push(resolve)
		})
	}

	private release(): void {
		const next = this.queue.shift()
		if (next) {
			next()
		} else {
			this.available++
		}
	}
}
