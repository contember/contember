type LabelValues<T extends string> = Partial<Record<T, string | number>>

export class CustomMetric<T extends string> {
	private values: { labels: LabelValues<T>; value: number }[] = []

	constructor(private readonly options: {
		name: string
		help: string
		type: string
		labelNames: T[]
	}) {
	}

	reset() {
		this.values = []
	}

	add(labels: LabelValues<T>, value: number) {
		this.values.push({ labels, value })
	}

	get name() {
		return this.options.name
	}

	get() {
		return {
			help: this.options.help,
			name: this.options.name,
			type: this.options.type,
			values: this.values,
			aggregator: 'sum',
		}
	}
}
