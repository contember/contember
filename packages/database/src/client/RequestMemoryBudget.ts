export interface RequestMemoryBudgetOptions {
	warnBytes: number
	maxBytes: number
}

const rowCompletionOverheadBytes = 256

export class RequestMemoryBudgetExceededError extends Error {
	constructor() {
		super('Request memory budget exceeded')
		this.name = 'RequestMemoryBudgetExceededError'
	}
}

export class RequestMemoryBudget {
	private databaseBytes = 0
	private hydrationBytes = 0
	private completionBytes = 0
	private peakBytes = 0
	private databaseRows = 0
	private failure: RequestMemoryBudgetExceededError | undefined
	private readonly abortController = new AbortController()

	constructor(private readonly options: RequestMemoryBudgetOptions) {
		if (
			!Number.isSafeInteger(options.warnBytes) || options.warnBytes <= 0
			|| !Number.isSafeInteger(options.maxBytes) || options.maxBytes <= 0
			|| options.warnBytes > options.maxBytes
		) {
			throw new Error('Request memory thresholds must be positive safe integers with warnBytes <= maxBytes')
		}
	}

	get signal(): AbortSignal {
		return this.abortController.signal
	}

	check(): void {
		if (this.failure) {
			throw this.failure
		}
	}

	addDatabaseRow(row: Record<string, unknown>): void {
		this.check()
		this.databaseRows++
		this.databaseBytes += 40
		for (const key in row) {
			if (Object.prototype.hasOwnProperty.call(row, key)) {
				this.databaseBytes += 16 + estimateValueBytes(row[key])
			}
		}
		this.update()
	}

	addHydrationBytes(bytes: number): void {
		this.check()
		this.hydrationBytes += bytes
		this.update()
	}

	prepareResponse(response: unknown): void {
		this.check()
		this.completionBytes = estimateValueBytes(response) * 2
		this.update()
	}

	snapshot() {
		return {
			estimatedRetainedBytes: this.databaseBytes + this.hydrationBytes,
			reservedCompletionBytes: this.getCompletionBytes(),
			estimatedPeakBytes: this.peakBytes,
			databaseRows: this.databaseRows,
			databaseBytes: this.databaseBytes,
			hydrationBytes: this.hydrationBytes,
			warnBytes: this.options.warnBytes,
			maxBytes: this.options.maxBytes,
			warningThresholdExceeded: this.peakBytes > this.options.warnBytes,
			maxBytesExceeded: this.peakBytes > this.options.maxBytes,
		}
	}

	private getCompletionBytes(): number {
		// Retain raw data conservatively until execution ends; GC timing is not request-local.
		return Math.max(this.completionBytes, this.databaseBytes * 2 + this.hydrationBytes) + this.databaseRows * rowCompletionOverheadBytes
	}

	private update(): void {
		const estimatedBytes = this.databaseBytes + this.hydrationBytes + this.getCompletionBytes()
		this.peakBytes = Math.max(this.peakBytes, estimatedBytes)
		if (estimatedBytes > this.options.maxBytes) {
			this.failure = new RequestMemoryBudgetExceededError()
			this.abortController.abort()
			throw this.failure
		}
	}
}

function estimateValueBytes(value: unknown): number {
	const scalarBytes = estimateScalarBytes(value)
	if (scalarBytes !== undefined) {
		return scalarBytes
	}
	let bytes = 0
	const pending: Iterator<unknown>[] = [[value].values()]
	while (pending.length > 0) {
		const next = pending[pending.length - 1].next()
		if (next.done) {
			pending.pop()
			continue
		}
		const current: unknown = next.value
		const scalarBytes = estimateScalarBytes(current)
		if (scalarBytes !== undefined) {
			bytes += scalarBytes
		} else if (Array.isArray(current)) {
			bytes += 32 + current.length * 8
			pending.push(current.values())
		} else if (current !== null && typeof current === 'object') {
			bytes += 32
			let hasNestedValues = false
			for (const key in current) {
				if (!Object.prototype.hasOwnProperty.call(current, key)) {
					continue
				}
				bytes += 16 + key.length * 2
				const scalarBytes = estimateScalarBytes(Reflect.get(current, key))
				if (scalarBytes === undefined) {
					hasNestedValues = true
				} else {
					bytes += scalarBytes
				}
			}
			if (hasNestedValues) {
				pending.push(nestedValues(current))
			}
		}
	}
	return bytes

	function* nestedValues(object: object): Generator<unknown> {
		for (const key in object) {
			if (Object.prototype.hasOwnProperty.call(object, key)) {
				const value: unknown = Reflect.get(object, key)
				if (estimateScalarBytes(value) === undefined) {
					yield value
				}
			}
		}
	}
}

function estimateScalarBytes(value: unknown): number | undefined {
	if (typeof value === 'string') {
		return 24 + value.length * 2
	}
	if (value === null || typeof value !== 'object') {
		return 8
	}
	if (value instanceof Date) {
		return 40
	}
	if (ArrayBuffer.isView(value)) {
		return 64 + value.byteLength
	}
	return undefined
}
