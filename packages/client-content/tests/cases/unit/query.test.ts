import { describe, expect, test } from 'bun:test'
import { createClient } from '../../lib'
import { Input } from '@contember/schema'
import OrderDirection = Input.OrderDirection
import { queryBuilder } from '../../client'

describe('queries', () => {

	const qb = queryBuilder
	test('list', async () => {
		const [client, calls] = createClient({
			authors: [
				{
					id: '1',
					name: 'John',
					email: 'foo@localhost',
				},
				{
					id: '2',
					name: 'John',
					email: 'bar@localhost',
				},
			],
		})
		const result = await client.query({
			authors: qb.list('Author', {}, it => it.$$()),
		})
		expect(result).toStrictEqual({
			authors: [
				{
					id: '1',
					name: 'John',
					email: 'foo@localhost',
				},
				{
					id: '2',
					name: 'John',
					email: 'bar@localhost',
				},
			],
		})
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toStrictEqual({})
	})

	test('multiple queries', async () => {
		const [client, calls] = createClient({
			authors: [
				{
					name: 'John',
					email: 'foo@localhost',
				},
				{
					name: 'John',
					email: 'bar@localhost',
				},
			],
			posts: [
				{
					title: 'Post 1',
					content: 'Content 1',
				},
				{
					title: 'Post 2',
					content: 'Content 2',
				},
			],
		})
		const result = await client.query({
			authors: qb.list('Author', {}, it => it.$$()),
			posts: qb.list('Post', {}, it => it.$$()),
		})
		expect(result as any).toStrictEqual({
			authors: [
				{
					name: 'John',
					email: 'foo@localhost',
				},
				{
					name: 'John',
					email: 'bar@localhost',
				},
			],
			posts: [
				{
					title: 'Post 1',
					content: 'Content 1',
				},
				{
					title: 'Post 2',
					content: 'Content 2',
				},
			],
		})
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toEqual({})
	})


	test('single query', async () => {
		const [client, calls] = createClient({
			value: [
				{
					title: 'Post 1',
					content: 'Content 1',
				},
				{
					title: 'Post 2',
					content: 'Content 2',
				},
			],
		})

		const result = await client.query(qb.list('Post', {}, it => it.$$()))
		expect(result as any).toStrictEqual([
			{
				title: 'Post 1',
				content: 'Content 1',
			},
			{
				title: 'Post 2',
				content: 'Content 2',
			},
		])
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toEqual({})
	})


	test('nested object', async () => {
		const [client, calls] = createClient()
		await client.query({
			authors: qb.list('Author', {}, it => it.$$().$('posts', {}, it => it.$$().$('tags', {}, it => it.$$()))),
		})
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toEqual({})
	})
	test('nested object args', async () => {
		const [client, calls] = createClient()
		await client.query({
			authors: qb.list('Author', {}, it => it.$$().$('posts', {
				limit: 10,
				filter: { tags: { name: { eq: 'foo' } } },
			}, it => it.$$())),
		})
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toStrictEqual({
			'Int_1': 10,
			'PostWhere_0': {
				'tags': {
					'name': {
						'eq': 'foo',
					},
				},
			},
		})
	})


	test('list with args', async () => {
		const [client, calls] = createClient()
		await client.query({
			authors: qb.list('Author', {
				filter: { name: { eq: 'John' } },
				orderBy: [{ name: OrderDirection.asc }],
				limit: 10,
				offset: 20,
			}, it => it.$$()),
		})
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot(`
			"query($AuthorWhere_0: AuthorWhere, $AuthorOrderBy_1: [AuthorOrderBy!], $Int_2: Int, $Int_3: Int) {
				authors: listAuthor(filter: $AuthorWhere_0, orderBy: $AuthorOrderBy_1, limit: $Int_2, offset: $Int_3) {
					id
					name
					email
				}
			}
			"
		`)
		expect(calls[0].variables).toStrictEqual(
			{
				'AuthorOrderBy_1': [
					{
						'name': 'asc',
					},
				],
				'AuthorWhere_0': {
					'name': {
						'eq': 'John',
					},
				},
				'Int_2': 10,
				'Int_3': 20,
			},
		)
	})


	test('get by id', async () => {
		const [client, calls] = createClient()
		const result = await client.query({
			authors: qb.get('Author', {
				by: { id: 'ca7a9b84-efbb-435d-a063-da11f205335a' },
			}, it => it.$$()),
		})
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toEqual({
			'AuthorUniqueWhere_0': {
				'id': 'ca7a9b84-efbb-435d-a063-da11f205335a',
			},
		})
	})

	test('top level list transform', async () => {
		const [client, calls] = createClient({
			authors: [
				{
					name: 'John',
					email: 'foo@localhost',
				},
				{
					name: 'Jane',
					email: 'bar@localhost',
				},
			],
		})
		const result = await client.query({
			authors: qb.list('Author', {}, it => it
				.$$()
				.transform(it => ({
					...it,
					label: `${it.name} (${it.email})`,
				})),
			),
		})
		expect(result as any).toStrictEqual({
			authors: [
				{
					name: 'John',
					email: 'foo@localhost',
					label: 'John (foo@localhost)',
				},
				{
					name: 'Jane',
					email: 'bar@localhost',
					label: 'Jane (bar@localhost)',
				},
			],
		})
		expect(calls).toHaveLength(1)
		expect(calls).toMatchSnapshot()
	})

	test('top level get transform', async () => {
		const [client, calls] = createClient({
			author: {
				name: 'John',
				email: 'foo@localhost',
			},
		})
		const result = await client.query({
			author: qb.get('Author', { by: { id: '123' } }, it => it
				.$$()
				.transform(it => ({
					...it,
					label: `${it.name} (${it.email})`,
				})),
			),
		})
		expect(result as any).toStrictEqual({
			author: {
				name: 'John',
				email: 'foo@localhost',
				label: 'John (foo@localhost)',
			},
		})
		expect(calls).toHaveLength(1)
		expect(calls).toMatchSnapshot()
	})


	test('nested has-many transform', async () => {
		const [client, calls] = createClient({
			author: {
				name: 'John',
				email: 'foo@localhost',
				posts: [
					{
						publishedAt: '2021-01-01T00:00:00Z',
					},
					{
						publishedAt: '2021-01-02T00:00:00Z',
					},
				],
			},
		})
		const result = await client.query({
			author: qb.get('Author', { by: { id: '123' } }, it => it
				.$$()
				.$('posts', {}, it => it.$$().transform(it => ({
					...it,
					publishYear: it.publishedAt ? new Date(it.publishedAt).getFullYear() : null,
				}))),
			),
		})
		expect(result as any).toStrictEqual({
			author: {
				name: 'John',
				email: 'foo@localhost',
				posts: [
					{
						publishedAt: '2021-01-01T00:00:00Z',
						publishYear: 2021,
					},
					{
						publishedAt: '2021-01-02T00:00:00Z',
						publishYear: 2021,
					},
				],
			},
		})
		expect(calls).toHaveLength(1)
		expect(calls).toMatchSnapshot()
	})


	test('nested has-one transform', async () => {
		const [client, calls] = createClient({
			post: {
				publishedAt: '2021-01-01T00:00:00Z',
				author: {
					name: 'John',
					email: 'foo@localhost',
				},
			},
		})
		const author = qb.fragment('Author', it => it
			.$$()
			.transform(it => ({
				...it,
				label: `${it.name} (${it.email})`,
			})),
		)

		const result = await client.query({
			post: qb.get('Post', { by: { id: '123' } }, it => it
				.$$()
				.$('author', author),
			),
		})
		expect(result as any).toStrictEqual({
			post: {
				publishedAt: '2021-01-01T00:00:00Z',
				author: {
					name: 'John',
					email: 'foo@localhost',
					label: 'John (foo@localhost)',
				},
			},
		})
		expect(calls).toMatchSnapshot()
	})


	test('nested has-many-by transform', async () => {
		const [client, calls] = createClient({
			post: {
				publishedAt: '2021-01-01T00:00:00Z',
				localesByLocale: {
					title: 'Hello',
				},
			},
		})
		const result = await client.query({
			post: qb.get('Post', { by: { id: '123' } }, it => it
				.$$()
				.$('localesByLocale', { by: { locale: { code: 'en' } } }, it => it.$$().transform(it => ({
					...it,
					label: it.title?.toUpperCase(),
				}))),
			),
		})
		expect(result as any).toStrictEqual({
			post: {
				publishedAt: '2021-01-01T00:00:00Z',
				localesByLocale: {
					title: 'Hello',
					label: 'HELLO',
				},
			},
		})
		expect(calls).toMatchSnapshot()
	})

	test('multiple transforms', async () => {
		const [client, calls] = createClient({
			author: {
				name: 'John',
				email: 'foo@localhost',
				posts: [
					{
						publishedAt: '2021-01-01T00:00:00Z',
					},
					{
						publishedAt: '2021-01-02T00:00:00Z',
					},
				],
			},
		})
		const result = await client.query({
			author: qb.get('Author', { by: { id: '123' } }, it => it
				.$$()
				.transform(it => ({
					...it,
					value1: 'foo',
				}))
				.$('posts', {}, it => it.$$().transform(it => ({
					...it,
					postLabel: 'foo bar',
				})))
				.transform(it => ({
					...it,
					value2: 'bar',
				})),
			),
		})
		expect(result as any).toStrictEqual({
			author: {
				name: 'John',
				email: 'foo@localhost',
				value1: 'foo',
				value2: 'bar',
				posts: [
					{
						publishedAt: '2021-01-01T00:00:00Z',
						postLabel: 'foo bar',
					},
					{
						publishedAt: '2021-01-02T00:00:00Z',
						postLabel: 'foo bar',
					},
				],
			},
		})
		expect(calls).toHaveLength(1)
	})

	test('omit', async () => {
		const [client, calls] = createClient({
			authors: [
				{
					id: '1',
					name: 'John',
				},
			],
		})
		const result = await client.query({
			authors: qb.list('Author', {}, it => it.$$().omit('email').$('posts', {}, it => it.$$()).omit('posts')),
		})
		expect(result).toStrictEqual({
			authors: [
				{
					id: '1',
					name: 'John',
				},
			],
		})
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toStrictEqual({})
	})

})
