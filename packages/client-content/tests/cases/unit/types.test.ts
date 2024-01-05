/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assertType, describe, expectTypeOf, test } from 'vitest'
import { FragmentOf, qb, Schema } from './lib'
import { ContentClientInput } from '../../../src'

describe('ts types', () => {
	test('fragment - valid', async () => {
		expectTypeOf(
			qb.fragment('Post')
				.$('author', qb.fragment('Author')),
		).toEqualTypeOf<FragmentOf<'Post'>>()
	})

	test('fragment - invalid', async () => {
		const postFragment = qb.fragment('Post')

		// @ts-expect-error
		assertType(postFragment.$('author', qb.fragment('Post')))
	})
})
