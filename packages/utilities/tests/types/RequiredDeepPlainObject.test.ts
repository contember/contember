import { expectTypeOf } from 'expect-type'
import { describe, test } from 'vitest'
import * as Types from '../../src/types'

describe('@contember/utilities', () => {
	test('@contember/utilities/types', () => {
		expectTypeOf<Types.RequiredDeepPlainObject<{ a: { b: { c: string; d: number } } }>>()
			.toEqualTypeOf<{ a: { b: { c: string; d: number } } }>()


		type A = Types.RequiredDeepPlainObject<{ a: { b: { c: string; d: number } } }>
		const _A1: A = { a: { b: { c: 'c', d: 1 } } }

		// @ts-expect-error: Property 'd' is missing in type '{ c: string; }' but required in type 'RequiredDeepPlainObject<{ c: string; d: number; }, "c" | "d">'
		const _A2: A = { a: { b: { c: 'c' } } }
	})
})
