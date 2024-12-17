import { describe, expect, test } from 'bun:test'
import { createClient } from '../../lib'
import { queryBuilder } from '../../client'

const qb = queryBuilder
describe('mutations in trx', () => {
	test('create trx', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
				mut: {
					ok: true,
				},
			},
		})
		const createAuthor = qb.transaction(qb.create('Author', {
			data: {
				name: 'John',
				email: 'xx@localhost',
			},
		}))
		const result = await client.mutate(createAuthor)


		expect(result.data.ok).toBe(true)
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

	test('mutation with a node', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
				mut: {
					ok: true,
					node: { id: 'ca7a9b84-efbb-435d-a063-da11f205335a' },
				},
			},
		})
		const result = await client.mutate(qb.transaction(qb.create('Author', {
			data: {
				name: 'John',
				email: 'xx@localhost',
			},
		}, it => it.$('id'))))
		expect(result.ok).toBe(true)
		expect(result.data?.node?.id).toBe('ca7a9b84-efbb-435d-a063-da11f205335a')
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

	test('update', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
				mut: {
					ok: true,
				},
			},
		})
		await client.mutate(qb.transaction(qb.update('Author', {
			by: { id: 'ca7a9b84-efbb-435d-a063-da11f205335a' },
			data: {
				name: 'John',
				email: 'xx@localhost',
			},
		})))
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

	test('delete', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
				mut: {
					ok: true,
				},
			},
		})
		await client.mutate(qb.transaction(qb.delete('Author', {
			by: { id: 'ca7a9b84-efbb-435d-a063-da11f205335a' },
		})))
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

	test('upsert', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
				mut: {
					ok: true,
				},
			},
		})
		await client.mutate(qb.transaction(qb.upsert('Author', {
			by: { id: 'ca7a9b84-efbb-435d-a063-da11f205335a' },
			create: {
				name: 'John',
				email: 'xx@localhost',
			},
			update: {
				name: 'John',
				email: 'xx@localhost',
			},
		})))
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

	test('multiple mutations as array', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
				mut_0: {
					ok: true,
				},
				mut_1: {
					ok: true,
				},
			},
		})
		const result = await client.mutate(qb.transaction([
			qb.create('Author', {
				data: {
					name: 'John',
					email: 'xx@localhost',
				},
			}),
			qb.create('Author', {
				data: {
					name: 'John',
					email: 'xx@localhost',
				},
			}),
		]))
		expect(result.ok).toBe(true)
		expect(result.data).toHaveLength(2)
		expect(result.data[0].ok).toBe(true)
		expect(result.data[1].ok).toBe(true)
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot(`
			{
			  "AuthorCreateInput_1": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			  "AuthorCreateInput_2": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			  "MutationTransactionOptions_0": {},
			}
		`)
	})

	test('multiple named mutations trx', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
				createAuthor: {
					ok: true,
				},
				createPost: {
					ok: true,
				},
			},
		})
		const result = await client.mutate(qb.transaction({
			createAuthor: qb.create('Author', {
				data: {
					name: 'John',
					email: 'xx@localhost',
				},
			}),
			createPost: qb.create('Post', {
				data: {
					publishedAt: 'now',
				},
			}),
		}))
		expect(result.data.createAuthor.ok).toBe(true)
		expect(result.data.createPost.ok).toBe(true)
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot(`
			"mutation($MutationTransactionOptions_0: MutationTransactionOptions, $AuthorCreateInput_1: AuthorCreateInput!, $PostCreateInput_2: PostCreateInput!) {
				mut: transaction(options: $MutationTransactionOptions_0) {
					ok
					errorMessage
					errors {
						... MutationError
					}
					validation {
						... ValidationResult
					}
					createAuthor(data: $AuthorCreateInput_1) {
						ok
						errorMessage
						errors {
							... MutationError
						}
						validation {
							... ValidationResult
						}
					}
					createPost(data: $PostCreateInput_2) {
						ok
						errorMessage
						errors {
							... MutationError
						}
						validation {
							... ValidationResult
						}
					}
				}
			}
			fragment MutationError on _MutationError {
				paths {
					... on _FieldPathFragment {
						field
					}
					... on _IndexPathFragment {
						index
						alias
					}
				}
				message
				type
			}
			fragment ValidationResult on _ValidationResult {
				valid
				errors {
					path {
						... on _FieldPathFragment {
							field
						}
						... on _IndexPathFragment {
							index
							alias
						}
					}
					message {
						text
					}
				}
			}
			"
		`)
		expect(calls[0].variables).toMatchSnapshot(`
			{
			  "AuthorCreateInput_1": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			  "MutationTransactionOptions_0": {},
			  "PostCreateInput_2": {
			    "publishedAt": "now",
			  },
			}
		`)
	})

	test('mutation and query combo trx', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
				createPost: {
					ok: true,
				},
				post: {
					value: {
						id: 'ca7a9b84-efbb-435d-a063-da11f205335a',
						publishedAt: 'now',
					},
				},
			},
		})

		const trx = qb.transaction({
			createPost: qb.create('Post', {
				data: {
					publishedAt: 'now',
				},
			}),
			post: qb.get('Post', {
				by: { id: 'ca7a9b84-efbb-435d-a063-da11f205335a' },
			}, it => it.$$()),
		})
		const result = await client.mutate(trx)
		expect(result.data.createPost.ok).toBe(true)
		expect(result.data.post?.publishedAt).toBe('now')

		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

})
describe('mutations without trx', () => {
	test('create', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
			},
		})
		const createAuthor = qb.create('Author', {
			data: {
				name: 'John',
				email: 'xx@localhost',
			},
		})
		const result = await client.mutate(createAuthor)


		expect(result.ok).toBe(true)
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

	test('mutation with a node', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
				node: { id: 'ca7a9b84-efbb-435d-a063-da11f205335a' },
			},
		})
		const result = await client.mutate(qb.create('Author', {
			data: {
				name: 'John',
				email: 'xx@localhost',
			},
		}, it => it.$('id')))
		expect(result.ok).toBe(true)
		expect(result.node?.id).toBe('ca7a9b84-efbb-435d-a063-da11f205335a')
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

	test('update', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
			},
		})
		await client.mutate(qb.update('Author', {
			by: { id: 'ca7a9b84-efbb-435d-a063-da11f205335a' },
			data: {
				name: 'John',
				email: 'xx@localhost',
			},
		}))
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

	test('delete', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
			},
		})
		await client.mutate(qb.delete('Author', {
			by: { id: 'ca7a9b84-efbb-435d-a063-da11f205335a' },
		}))
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

	test('upsert', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
			},
		})
		await client.mutate(qb.upsert('Author', {
			by: { id: 'ca7a9b84-efbb-435d-a063-da11f205335a' },
			create: {
				name: 'John',
				email: 'xx@localhost',
			},
			update: {
				name: 'John',
				email: 'xx@localhost',
			},
		}))
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

	test('multiple mutations as array', async () => {
		const [client, calls] = createClient({
			mut_0: {
				ok: true,
			},
			mut_1: {
				ok: true,
			},
		})
		const result = await client.mutate([
			qb.create('Author', {
				data: {
					name: 'John',
					email: 'xx@localhost',
				},
			}),
			qb.create('Author', {
				data: {
					name: 'John',
					email: 'xx@localhost',
				},
			}),
		])
		expect(result).toHaveLength(2)
		expect(result[0].ok).toBe(true)
		expect(result[1].ok).toBe(true)
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

	test('multiple named mutations', async () => {
		const [client, calls] = createClient({
			createAuthor: {
				ok: true,
			},
			createPost: {
				ok: true,
			},
		})
		const result = await client.mutate({
			createAuthor: qb.create('Author', {
				data: {
					name: 'John',
					email: 'xx@localhost',
				},
			}),
			createPost: qb.create('Post', {
				data: {
					publishedAt: 'now',
				},
			}),
		})
		expect(result.createAuthor.ok).toBe(true)
		expect(result.createPost.ok).toBe(true)
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

	test('mutation and query combo', async () => {
		const [client, calls] = createClient({
			createPost: {
				ok: true,
			},
			post: {
				value: {
					id: 'ca7a9b84-efbb-435d-a063-da11f205335a',
					publishedAt: 'now',
				},
			},
		})

		const result = await client.mutate({
			createPost: qb.create('Post', {
				data: {
					publishedAt: 'now',
				},
			}),
			post: qb.get('Post', {
				by: { id: 'ca7a9b84-efbb-435d-a063-da11f205335a' },
			}, it => it.$$()),
		})
		expect(result.createPost.ok).toBe(true)
		expect(result.post?.publishedAt).toBe('now')

		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

	test('update locale relation', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
			},
		})

		const result = await client.mutate(qb.update('Post', {
			by: { id: 'ca7a9b84-efbb-435d-a063-da11f205335a' },
			data: {
				publishedAt: 'now',
				locales: [{
					update: {
						by: { locale: { code: 'cs' } },
						data: {
							title: 'cs title',
						},
					},
				}],
			},
		}))
		expect(result.ok).toBe(true)
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchSnapshot()
		expect(calls[0].variables).toMatchSnapshot()
	})

})
