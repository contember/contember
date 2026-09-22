import { Buffer } from 'node:buffer'

export interface RequestMemoryBudgetOptions {
	warnBytes: number
	maxBytes: number
}

const rowCompletionOverheadBytes = 256
const maximumRecursiveEstimateDepth = 64
const isBun = process.versions.bun !== undefined

export const validateRequestMemoryBudgetOptions = ({ warnBytes, maxBytes }: RequestMemoryBudgetOptions): string | undefined => {
	if (!Number.isSafeInteger(warnBytes) || warnBytes <= 0) {
		return 'warnBytes must be a positive safe integer'
	}
	if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
		return 'maxBytes must be a positive safe integer'
	}
	if (warnBytes > maxBytes) {
		return 'warnBytes must not exceed maxBytes'
	}
	return undefined
}

export class RequestMemoryBudgetExceededError extends Error {
	constructor() {
		super('Request memory budget exceeded')
		this.name = 'RequestMemoryBudgetExceededError'
	}
}

export class RequestMemoryBudget {
	private databaseBytes = 0
	private hydrationBytes = 0
	private peakBytes = 0
	private databaseRows = 0
	private largestDatabaseRowBytes = 0
	private readonly databaseStrings = new StringMemoryEstimate()
	private failure: RequestMemoryBudgetExceededError | undefined
	// A plain set rather than an AbortSignal: every in-flight query of the request listens, and Node 20 warns above ten signal listeners.
	private readonly exceededListeners = new Set<(failure: RequestMemoryBudgetExceededError) => void>()

	constructor(private readonly options: RequestMemoryBudgetOptions) {
		const optionsError = validateRequestMemoryBudgetOptions(options)
		if (optionsError) {
			throw new Error(`Invalid request memory budget: ${optionsError}`)
		}
	}

	get exceeded(): boolean {
		return this.failure !== undefined
	}

	check(): void {
		if (this.failure) {
			throw this.failure
		}
	}

	/** Calls the listener once the budget is exceeded, immediately when it already is. Returns the unsubscribe. */
	onExceeded(listener: (failure: RequestMemoryBudgetExceededError) => void): () => void {
		if (this.failure) {
			listener(this.failure)
			return () => {}
		}
		this.exceededListeners.add(listener)
		return () => this.exceededListeners.delete(listener)
	}

	addDatabaseRow(row: Record<string, unknown>): void {
		this.check()
		this.databaseRows++
		let rowBytes = 40
		for (const key in row) {
			if (Object.prototype.hasOwnProperty.call(row, key)) {
				rowBytes += 16 + estimateValueBytes(row[key], this.databaseStrings)
			}
		}
		this.databaseBytes += rowBytes
		this.largestDatabaseRowBytes = Math.max(this.largestDatabaseRowBytes, rowBytes)
		this.update()
	}

	addHydrationBytes(bytes: number): void {
		this.check()
		this.hydrationBytes += bytes
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
		// GraphQL shares scalar strings with DB results; completion allocates structures and serialized text.
		const projectedCompletionBytes = (this.databaseBytes - this.databaseStrings.retainedBytes) * 2
			+ this.databaseStrings.serializedBytes + this.hydrationBytes
		// Decoding a row and serializing the response happen in different phases.
		// JSC includes pg's growing buffers in its heap account; V8 reports them as external memory.
		const decodingBytes = this.largestDatabaseRowBytes * (isBun ? 3 : 1)
		return Math.max(projectedCompletionBytes, decodingBytes)
			+ this.databaseRows * rowCompletionOverheadBytes
	}

	private update(): void {
		const estimatedBytes = this.databaseBytes + this.hydrationBytes + this.getCompletionBytes()
		this.peakBytes = Math.max(this.peakBytes, estimatedBytes)
		if (estimatedBytes > this.options.maxBytes) {
			const failure = new RequestMemoryBudgetExceededError()
			this.failure = failure
			const listeners = [...this.exceededListeners]
			this.exceededListeners.clear()
			listeners.forEach(listener => listener(failure))
			throw failure
		}
	}
}

function estimateValueBytes(value: unknown, strings: StringMemoryEstimate): number {
	return estimateScalarBytes(value, strings) ?? estimateStructuredValueBytes(value, strings, 0)
}

function estimateStructuredValueBytes(value: unknown, strings: StringMemoryEstimate, depth: number): number {
	if (depth >= maximumRecursiveEstimateDepth) {
		return estimateDeepValueBytes(value, strings)
	}
	if (Array.isArray(value)) {
		let bytes = 32 + value.length * 8
		for (let i = 0; i < value.length; i++) {
			const item: unknown = value[i]
			const scalarBytes = estimateScalarBytes(item, strings)
			bytes += scalarBytes ?? estimateStructuredValueBytes(item, strings, depth + 1)
		}
		return bytes
	}
	let bytes = 32
	if (value !== null && typeof value === 'object') {
		for (const key in value) {
			if (Object.prototype.hasOwnProperty.call(value, key)) {
				const item: unknown = Reflect.get(value, key)
				const scalarBytes = estimateScalarBytes(item, strings)
				strings.addPropertyName(key)
				bytes += 16 + (scalarBytes ?? estimateStructuredValueBytes(item, strings, depth + 1))
			}
		}
	}
	return bytes
}

function estimateDeepValueBytes(value: unknown, strings: StringMemoryEstimate): number {
	const scalarBytes = estimateScalarBytes(value, strings)
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
		const scalarBytes = estimateScalarBytes(current, strings)
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
				strings.addPropertyName(key)
				bytes += 16
				const scalarBytes = estimateScalarBytes(Reflect.get(current, key), strings)
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
				if (value !== null && typeof value === 'object' && !(value instanceof Date) && !ArrayBuffer.isView(value)) {
					yield value
				}
			}
		}
	}
}

function estimateScalarBytes(value: unknown, strings: StringMemoryEstimate): number | undefined {
	if (typeof value === 'string') {
		return 24 + strings.add(value)
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

class StringMemoryEstimate {
	private codeUnits = 0
	private storageBytes = 0
	private nonAscii = false

	get retainedBytes(): number {
		return this.storageBytes
	}

	get serializedBytes(): number {
		// One non-ASCII string can promote the entire serialized JSON string to two-byte storage.
		return this.codeUnits * (this.nonAscii ? 2 : 1)
	}

	add(value: string): number {
		// A native length comparison avoids a JavaScript character loop and RegExp.input, which can retain a request string.
		const ascii = Buffer.byteLength(value) === value.length
		this.nonAscii ||= !ascii
		this.codeUnits += value.length
		const bytes = ascii ? value.length : value.length * 2
		this.storageBytes += bytes
		return bytes
	}

	// Runtimes share property names between objects of one shape; only their serialized copies are new.
	addPropertyName(key: string): void {
		this.codeUnits += key.length
	}
}
