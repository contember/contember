export class DirtinessTracker {
	private changesCount = 0

	public getChangesCount() {
		return this.changesCount
	}

	public hasChanges() {
		return this.changesCount > 0
	}

	public reset() {
		this.changesCount = 0
	}

	public increment() {
		this.changesCount++
	}

	public decrement() {
		this.changesCount--
	}

	public increaseBy(delta: number) {
		this.changesCount += delta
	}
}
