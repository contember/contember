/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, expect, test } from 'bun:test'
import { ContentClientInput } from '../../../src'
import { ContemberClientEntities, FragmentOf, FragmentType, queryBuilder } from '../../client'
import { expectTypeOf } from 'expect-type'

const qb = queryBuilder
describe('ts types', () => {
	test('fragment - valid', async () => {
		expectTypeOf(
			qb.fragment('Post')
				.$('author', qb.fragment('Author')),
		).toMatchTypeOf<FragmentOf<'Post'>>()
	})

	test('fragment - invalid', async () => {
		const postFragment = qb.fragment('Post')

		// @ts-expect-error
		postFragment.$('author', qb.fragment('Post'))
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

	test('has one field on fragment type', async () => {
		const fragment = qb.fragment('Post', it => it.$('author', it => it.$$().$('posts', it => it.$('id'))))
		type fragmentType = FragmentType<typeof fragment>
		expectTypeOf<fragmentType>().toEqualTypeOf<{ author: ({ id: string; name: string | null; email: string | null } & { posts: { id: string }[] }) | null }>()
	})


	test('has one without arg', async () => {
		qb.list('Post', {}, it => it.$('author', it => it.$$()))
	})

	test('has one with arg', async () => {
		qb.list('Post', {}, it => it.$('author', { filter: { name: { eq: 'John' } } }, it => it.$$()))
	})

	test('has one with invalid arg', async () => {
		qb.list('Post', {}, it => it
			.$('author',
				// @ts-expect-error
				{ filter: { foo: { eq: 'xx' } } },
				it => it.$$(),
			),
		)
	})

	test('has many without arg', async () => {
		qb.list('Post', {}, it => it.$('locales', it => it.$$()))
	})

	test('has many with arg', async () => {
		qb.list('Post', {}, it => it.$('locales', { filter: { locale: { code: { eq: 'cs' } } } },  it => it.$$()))
	})

	test('has many with invalid arg', async () => {
		qb.list('Post', {}, it => it
			.$('locales',
				// @ts-expect-error
				{ filter: { locale: { eq: 'cs' } } },
				it => it.$$(),
			),
		)
	})

	test('reduced has may', async () => {
		qb.list('Post', {}, it => it.$('localesByLocale', { by: { locale: { code: 'cs' } } },  it => it.$$()))
	})

	test('reduced has may - invalid "by"', async () => {
		qb.list('Post',
			{},
			it => it
				.$('localesByLocale',
					// @ts-expect-error
					{ by: { locale: {} } },
					qb.fragment('PostLocale'),
				),
		)
	})


	test('invalid field', async () => {
		expect(() => {
			qb.list(
				'Post',
				{},
				// @ts-expect-error
				it => it.$('lorem', it => it.$$()),
			)
		}).toThrow('Field Post.lorem does not exist.')
	})
})
