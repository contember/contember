import { describe, expect, test } from 'vitest'
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
					name: 'John',
					email: 'foo@localhost',
				},
				{
					name: 'John',
					email: 'bar@localhost',
				},
			],
		})
		const result = await client.query({
			authors: qb.list('Author', {}, it => it.$$()),
		})
		expect(result).toEqual({
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
		})
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"query {
				authors: listAuthor {
					id
					name
					email
				}
			}
			"
		`)
		expect(calls[0].variables).toMatchInlineSnapshot('{}')
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
		expect(result).toEqual({
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
		expect(calls[0].query).toMatchInlineSnapshot(`
			"query {
				authors: listAuthor {
					id
					name
					email
				}
				posts: listPost {
					id
					publishedAt
				}
			}
			"
		`)
		expect(calls[0].variables).toMatchInlineSnapshot('{}')
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
		expect(result).toEqual([
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
		expect(calls[0].query).toMatchInlineSnapshot(`
			"query {
				value: listPost {
					id
					publishedAt
				}
			}
			"
		`)
		expect(calls[0].variables).toMatchInlineSnapshot('{}')
	})


	test('nested object', async () => {
		const [client, calls] = createClient()
		await client.query({
			authors: qb.list('Author', {}, it => it.$$().$('posts', {}, it => it.$$().$('tags', {}, it => it.$$()))),
		})
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"query {
				authors: listAuthor {
					id
					name
					email
					posts {
						id
						publishedAt
						tags {
							id
							name
						}
					}
				}
			}
			"
		`)
		expect(calls[0].variables).toMatchInlineSnapshot('{}')
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
		expect(calls[0].query).toMatchInlineSnapshot(`
			"query($PostWhere_0: PostWhere, $Int_1: Int) {
				authors: listAuthor {
					id
					name
					email
					posts(filter: $PostWhere_0, limit: $Int_1) {
						id
						publishedAt
					}
				}
			}
			"
		`)
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "Int_1": 10,
			  "PostWhere_0": {
			    "tags": {
			      "name": {
			        "eq": "foo",
			      },
			    },
			  },
			}
		`)
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
		expect(calls[0].query).toMatchInlineSnapshot(`
			"query($AuthorWhere_0: AuthorWhere, $AuthorOrderBy_1: [AuthorOrderBy!], $Int_2: Int, $Int_3: Int) {
				authors: listAuthor(filter: $AuthorWhere_0, orderBy: $AuthorOrderBy_1, limit: $Int_2, offset: $Int_3) {
					id
					name
					email
				}
			}
			"
		`)
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "AuthorOrderBy_1": [
			    {
			      "name": "asc",
			    },
			  ],
			  "AuthorWhere_0": {
			    "name": {
			      "eq": "John",
			    },
			  },
			  "Int_2": 10,
			  "Int_3": 20,
			}
		`)
	})


	test('get by id', async () => {
		const [client, calls] = createClient()
		const result = await client.query({
			authors: qb.get('Author', {
				by: { id: 'ca7a9b84-efbb-435d-a063-da11f205335a' },
			}, it => it.$$()),
		})
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"query($AuthorUniqueWhere_0: AuthorUniqueWhere!) {
				authors: getAuthor(by: $AuthorUniqueWhere_0) {
					id
					name
					email
				}
			}
			"
		`)
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "AuthorUniqueWhere_0": {
			    "id": "ca7a9b84-efbb-435d-a063-da11f205335a",
			  },
			}
		`)
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
		expect(result).toEqual({
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
		expect(result).toEqual({
			author: {
				name: 'John',
				email: 'foo@localhost',
				label: 'John (foo@localhost)',
			},
		})
		expect(calls).toHaveLength(1)
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
		expect(result).toEqual({
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
		expect(result).toEqual({
			post: {
				publishedAt: '2021-01-01T00:00:00Z',
				author: {
					name: 'John',
					email: 'foo@localhost',
					label: 'John (foo@localhost)',
				},
			},
		})
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
		expect(result).toEqual({
			post: {
				publishedAt: '2021-01-01T00:00:00Z',
				localesByLocale: {
					title: 'Hello',
					label: 'HELLO',
				},
			},
		})
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
		expect(result).toEqual({
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

})
