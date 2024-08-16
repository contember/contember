export class DirtinessTracker {
	private changesCount = 0
	private touchedCount = 0

	public getTotalTouchCount() {
		return this.touchedCount
	}

	public hasChanges() {
		return this.changesCount > 0
	}

	public reset() {
		this.changesCount = 0
	}

	public increaseBy(delta: number) {
		this.changesCount += delta
		this.touchedCount++
	}
}
