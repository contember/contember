import { describe, expect, test } from 'vitest'
import { createClient, qb } from './lib'
import { Input } from '@contember/schema'
import OrderDirection = Input.OrderDirection;

describe('queries', () => {

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
					name
					email
				}
				posts: listPost {
					title
					content
				}
			}
			"
		`)
		expect(calls[0].variables).toMatchInlineSnapshot('{}')
	})


	test('single query', async () => {
		const [client, calls] = createClient({ value: [
				{
					title: 'Post 1',
					content: 'Content 1',
				},
				{
					title: 'Post 2',
					content: 'Content 2',
				},
			] })

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
					title
					content
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
					name
					email
					posts {
						title
						content
						tags {
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
			"query($filter_PostWhere_0: PostWhere, $limit_Int_1: Int) {
				authors: listAuthor {
					name
					email
					posts(filter: $filter_PostWhere_0, limit: $limit_Int_1) {
						title
						content
					}
				}
			}
			"
		`)
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "filter_PostWhere_0": {
			    "tags": {
			      "name": {
			        "eq": "foo",
			      },
			    },
			  },
			  "limit_Int_1": 10,
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
			"query($filter_AuthorWhere_0: AuthorWhere, $orderBy_AuthorOrderBy_1: [AuthorOrderBy!], $limit_Int_2: Int, $offset_Int_3: Int) {
				authors: listAuthor(filter: $filter_AuthorWhere_0, orderBy: $orderBy_AuthorOrderBy_1, limit: $limit_Int_2, offset: $offset_Int_3) {
					name
					email
				}
			}
			"
		`)
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "filter_AuthorWhere_0": {
			    "name": {
			      "eq": "John",
			    },
			  },
			  "limit_Int_2": 10,
			  "offset_Int_3": 20,
			  "orderBy_AuthorOrderBy_1": [
			    {
			      "name": "asc",
			    },
			  ],
			}
		`)
	})


	test('get by id', async () => {
		const [client, calls] = createClient()
		const result = await client.query({
			authors: qb.get('Author', {
				by: { id: 123 },
			}, it => it.$$()),
		})
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"query($by_AuthorUniqueWhere_0: AuthorUniqueWhere!) {
				authors: getAuthor(by: $by_AuthorUniqueWhere_0) {
					name
					email
				}
			}
			"
		`)
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "by_AuthorUniqueWhere_0": {
			    "id": 123,
			  },
			}
		`)
	})
})
