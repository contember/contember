import { describe, expect, test } from 'vitest'
import { createClient } from '../../lib'
import { Input } from '@contember/schema'
import OrderDirection = Input.OrderDirection;
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
})
