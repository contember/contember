export class Mutex {
	private resolvers: (() => void)[] = []

	private locked = false

	public async execute<T>(cb: () => T): Promise<T> {
		await this.lock()
		try {
			return await cb()
		} finally {
			this.release()
		}
	}

	private lock(): Promise<void> {
		if (!this.locked) {
			this.locked = true
			return Promise.resolve()
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
