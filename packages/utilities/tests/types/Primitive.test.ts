import { expectTypeOf } from 'expect-type'
import { describe, test } from 'vitest'
import * as Types from '../../src/types'

describe('@contember/utilities', () => {
	test('@contember/utilities/types', () => {
		expectTypeOf<Types.TypeofStringLiteral<'a'>>().toEqualTypeOf<'a'>()
		expectTypeOf<Types.TypeofStringLiteral<'a' | 'b'>>().toEqualTypeOf<'a' | 'b'>()
		expectTypeOf<Types.TypeofStringLiteral<'a' | 'b' | string>>().toBeNever()
	})
})
