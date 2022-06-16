declare type LabelValues<T extends string> = Partial<Record<T, string | number>>
export declare class CustomMetric<T extends string> {
	private readonly options
	private values
	constructor(options: {
		name: string
		help: string
		type: string
		labelNames: T[]
	})
	reset(): void
	add(labels: LabelValues<T>, value: number): void
	get name(): string
	get(): {
		help: string
		name: string
		type: string
		values: {
			labels: Partial<Record<T, string | number>>
			value: number
		}[]
		aggregator: string
	}
}
export {}
//# sourceMappingURL=CustomMetric.d.ts.map
