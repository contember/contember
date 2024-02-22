/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assertType, describe, expectTypeOf, test } from 'vitest'
import { ContentClientInput } from '../../../src'
import { ContemberClientEntities, FragmentOf, queryBuilder } from '../../client'

const qb = queryBuilder
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

	test('where - valid', async () => {
		qb.list('Post', {
			filter: {
				publishedAt: { eq: 'foo' },
			},
		}, it => it.$$())
	})

	test('where - invalid with literal', async () => {
		qb.list('Post', {
			filter: {
				// @ts-expect-error
				caption: { eq: 'foo' },
			},
		}, it => it.$$())
	})

	test('where - invalid assignment to type', async () => {
		const where: ContentClientInput.Where<ContemberClientEntities['Post']> = {
			// @ts-expect-error
			caption: { eq: 'foo' },
		}
	})

	test('where - valid extracted without a type', async () => {
		const where = {
			publishedAt: { eq: 'foo' },
		}
		qb.list('Post', {
			filter: where,
		}, it => it.$$())
	})

	test('where - valid extracted with a type', async () => {
		const where: ContentClientInput.Where<ContemberClientEntities['Post']> = {
			publishedAt: { eq: 'foo' },
		}
		qb.list('Post', {
			filter: where,
		}, it => it.$$())
	})

	test('where - incompatible types', async () => {
		const where: ContentClientInput.Where<ContemberClientEntities['Post']> = {
			publishedAt: { eq: 'foo' },
		}
		qb.list('Author', {
			// @ts-expect-error
			filter: where,
		}, it => it.$$())
	})
})
