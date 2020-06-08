class Merger {
	static merge<P = Merger.ValuePrimitive>(...values: Merger.ValueObject<P>[]): Merger.ValueObject<P> {
		return values
			.reduce<[string, Merger.ValueItem<P>][]>((acc, val) => [...acc, ...Object.entries(val || {})], [])
			.reduce<Merger.ValueObject<P>>((acc, [key, value]) => {
				if (!acc.hasOwnProperty(key)) {
					return { ...acc, [key]: value }
				}
				const currValue = acc[key]
				if (Array.isArray(currValue) && Array.isArray(value)) {
					return { ...acc, [key]: [...currValue, ...value] }
				}
				if (Merger.isValueObject(currValue) && Merger.isValueObject(value)) {
					return { ...acc, [key]: Merger.merge<P>(currValue, value) }
				}
				return { ...acc, [key]: value }
			}, {})
	}
}

namespace Merger {
	export const isValueObject = <P>(value: any): value is ValueObject<P> => typeof value === 'object' && value !== null

	export type ValuePrimitive = string | number | null | boolean | Date
	export type ValueItem<P> = P | ValueObject<P> | ValueArray<P>

	export interface ValueObject<P> {
		[x: string]: ValueItem<P>
	}

	export interface ValueArray<P> extends Array<ValueItem<P>> {}
}

export default Merger
