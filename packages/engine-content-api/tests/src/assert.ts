import { expect } from 'bun:test'

export const assert = {
	deepStrictEqual: (a: any, b: any) => {
		expect(a).toEqual(b)
	},
	equal: (a: any, b: any) => {
		expect(a).toEqual(b)
	},
}
