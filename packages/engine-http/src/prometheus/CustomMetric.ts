type LabelValues<T extends string> = Partial<Record<T, string | number>>

export class CustomMetric<T extends string> {
	private values = new Map<string, { labels: LabelValues<T>; value: number }>()

	constructor(
		private readonly options: {
			name: string
			help: string
			type: string
			labelNames: T[]
		},
	) {
	}

	reset() {
		this.values.clear()
	}

	add(labels: LabelValues<T>, value: number) {
		const key = this.labelKey(labels)
		const existing = this.values.get(key)
		if (existing) {
			existing.value += value
		} else {
			this.values.set(key, { labels, value })
		}
	}

	get name() {
		return this.options.name
	}

	get() {
		return {
			help: this.options.help,
			name: this.options.name,
			type: this.options.type,
			values: Array.from(this.values.values()),
			aggregator: 'sum',
		}
	}

	private labelKey(labels: LabelValues<T>): string {
		const parts: string[] = []
		for (const name of this.options.labelNames) {
			parts.push(`${name}=${labels[name] ?? ''}`)
		}
		return parts.join('\x00')
	}
}
