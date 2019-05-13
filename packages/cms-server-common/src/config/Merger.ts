class Merger {
	static merge(...values: Merger.ValueObject[]): Merger.ValueObject {
		return values
			.reduce<[string, Merger.ValueItem][]>((acc, val) => [...acc, ...Object.entries(val)], [])
			.reduce<Merger.ValueObject>((acc, [key, value]) => {
				if (!acc.hasOwnProperty(key)) {
					return { ...acc, [key]: value }
				}
				const currValue = acc[key]
				if (Merger.isValueObject(currValue) && Merger.isValueObject(value)) {
					return { ...acc, [key]: Merger.merge(currValue, value) }
				}
				if (Array.isArray(currValue) && Array.isArray(value)) {
					return { ...acc, [key]: [...currValue, ...value] }
				}
				return { ...acc, [key]: value }
			}, {})
	}
}

namespace Merger {
	export const isValueObject = (value: any): value is ValueObject => typeof value === 'object' && value !== null

	export type ValueItem = string | number | boolean | Date | ValueObject | ValueArray

	export interface ValueObject {
		[x: string]: ValueItem
	}

	export interface ValueArray extends Array<ValueItem> {}
}

export default Merger
