import { describe, expect, test } from 'vitest'
import { createClient, qb } from './lib'
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
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($options_MutationTransactionOptions_0: MutationTransactionOptions, $data_AuthorCreateInput_1: AuthorCreateInput!) {
				mut: transaction(options: $options_MutationTransactionOptions_0) {
					ok
					errorMessage
					errors {
						... MutationError
					}
					validation {
						... ValidationResult
					}
					mut: createAuthor(data: $data_AuthorCreateInput_1) {
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "data_AuthorCreateInput_1": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			  "options_MutationTransactionOptions_0": {},
			}
		`)
	})

	test('mutation with a node', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
				mut: {
					ok: true,
					node: { id: 123 },
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
		expect(result.data?.node?.id).toBe(123)
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($options_MutationTransactionOptions_0: MutationTransactionOptions, $data_AuthorCreateInput_1: AuthorCreateInput!) {
				mut: transaction(options: $options_MutationTransactionOptions_0) {
					ok
					errorMessage
					errors {
						... MutationError
					}
					validation {
						... ValidationResult
					}
					mut: createAuthor(data: $data_AuthorCreateInput_1) {
						ok
						errorMessage
						errors {
							... MutationError
						}
						validation {
							... ValidationResult
						}
						node {
							id
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "data_AuthorCreateInput_1": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			  "options_MutationTransactionOptions_0": {},
			}
		`)
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
			by: { id: 1 },
			data: {
				name: 'John',
				email: 'xx@localhost',
			},
		})))
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($options_MutationTransactionOptions_0: MutationTransactionOptions, $by_AuthorUniqueWhere_1: AuthorUniqueWhere!, $data_AuthorUpdateInput_2: AuthorUpdateInput!) {
				mut: transaction(options: $options_MutationTransactionOptions_0) {
					ok
					errorMessage
					errors {
						... MutationError
					}
					validation {
						... ValidationResult
					}
					mut: updateAuthor(by: $by_AuthorUniqueWhere_1, data: $data_AuthorUpdateInput_2) {
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "by_AuthorUniqueWhere_1": {
			    "id": 1,
			  },
			  "data_AuthorUpdateInput_2": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			  "options_MutationTransactionOptions_0": {},
			}
		`)
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
			by: { id: 1 },
		})))
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($options_MutationTransactionOptions_0: MutationTransactionOptions, $by_AuthorUniqueWhere_1: AuthorUniqueWhere!) {
				mut: transaction(options: $options_MutationTransactionOptions_0) {
					ok
					errorMessage
					errors {
						... MutationError
					}
					validation {
						... ValidationResult
					}
					mut: deleteAuthor(by: $by_AuthorUniqueWhere_1) {
						ok
						errorMessage
						errors {
							... MutationError
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "by_AuthorUniqueWhere_1": {
			    "id": 1,
			  },
			  "options_MutationTransactionOptions_0": {},
			}
		`)
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
			by: { id: 1 },
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
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($options_MutationTransactionOptions_0: MutationTransactionOptions, $by_AuthorUniqueWhere_1: AuthorUniqueWhere!, $create_AuthorCreateInput_2: AuthorCreateInput!, $update_AuthorUpdateInput_3: AuthorUpdateInput!) {
				mut: transaction(options: $options_MutationTransactionOptions_0) {
					ok
					errorMessage
					errors {
						... MutationError
					}
					validation {
						... ValidationResult
					}
					mut: upsertAuthor(by: $by_AuthorUniqueWhere_1, create: $create_AuthorCreateInput_2, update: $update_AuthorUpdateInput_3) {
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
					{
					  "by_AuthorUniqueWhere_1": {
					    "id": 1,
					  },
					  "create_AuthorCreateInput_2": {
					    "email": "xx@localhost",
					    "name": "John",
					  },
					  "options_MutationTransactionOptions_0": {},
					  "update_AuthorUpdateInput_3": {
					    "email": "xx@localhost",
					    "name": "John",
					  },
					}
				`)
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
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($options_MutationTransactionOptions_0: MutationTransactionOptions, $data_AuthorCreateInput_1: AuthorCreateInput!, $data_AuthorCreateInput_2: AuthorCreateInput!) {
				mut: transaction(options: $options_MutationTransactionOptions_0) {
					ok
					errorMessage
					errors {
						... MutationError
					}
					validation {
						... ValidationResult
					}
					mut_0: createAuthor(data: $data_AuthorCreateInput_1) {
						ok
						errorMessage
						errors {
							... MutationError
						}
						validation {
							... ValidationResult
						}
					}
					mut_1: createAuthor(data: $data_AuthorCreateInput_2) {
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "data_AuthorCreateInput_1": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			  "data_AuthorCreateInput_2": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			  "options_MutationTransactionOptions_0": {},
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
					title: 'Hello',
					content: 'World',
				},
			}),
		}))
		expect(result.data.createAuthor.ok).toBe(true)
		expect(result.data.createPost.ok).toBe(true)
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($options_MutationTransactionOptions_0: MutationTransactionOptions, $data_AuthorCreateInput_1: AuthorCreateInput!, $data_PostCreateInput_2: PostCreateInput!) {
				mut: transaction(options: $options_MutationTransactionOptions_0) {
					ok
					errorMessage
					errors {
						... MutationError
					}
					validation {
						... ValidationResult
					}
					createAuthor(data: $data_AuthorCreateInput_1) {
						ok
						errorMessage
						errors {
							... MutationError
						}
						validation {
							... ValidationResult
						}
					}
					createPost(data: $data_PostCreateInput_2) {
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
				{
				  "data_AuthorCreateInput_1": {
				    "email": "xx@localhost",
				    "name": "John",
				  },
				  "data_PostCreateInput_2": {
				    "content": "World",
				    "title": "Hello",
				  },
				  "options_MutationTransactionOptions_0": {},
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
						id: 1,
						title: 'Foo bar',
						content: 'Hello world',
					},
				},
			},
		})

		const trx = qb.transaction({
			createPost: qb.create('Post', {
				data: {
					title: 'Hello',
					content: 'World',
				},
			}),
			post: qb.get('Post', {
				by: { id: 1 },
			}, it => it.$$()),
		})
		const result = await client.mutate(trx)
		expect(result.data.createPost.ok).toBe(true)
		expect(result.data.post?.title).toBe('Foo bar')

		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($options_MutationTransactionOptions_0: MutationTransactionOptions, $data_PostCreateInput_1: PostCreateInput!, $by_PostUniqueWhere_2: PostUniqueWhere!) {
				mut: transaction(options: $options_MutationTransactionOptions_0) {
					ok
					errorMessage
					errors {
						... MutationError
					}
					validation {
						... ValidationResult
					}
					createPost(data: $data_PostCreateInput_1) {
						ok
						errorMessage
						errors {
							... MutationError
						}
						validation {
							... ValidationResult
						}
					}
					post: query {
						value: getPost(by: $by_PostUniqueWhere_2) {
							title
							content
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
						{
						  "by_PostUniqueWhere_2": {
						    "id": 1,
						  },
						  "data_PostCreateInput_1": {
						    "content": "World",
						    "title": "Hello",
						  },
						  "options_MutationTransactionOptions_0": {},
						}
					`)
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
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($data_AuthorCreateInput_0: AuthorCreateInput!) {
				mut: createAuthor(data: $data_AuthorCreateInput_0) {
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "data_AuthorCreateInput_0": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			}
		`)
	})

	test('mutation with a node', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
				node: { id: 123 },
			},
		})
		const result = await client.mutate(qb.create('Author', {
			data: {
				name: 'John',
				email: 'xx@localhost',
			},
		}, it => it.$('id')))
		expect(result.ok).toBe(true)
		expect(result.node?.id).toBe(123)
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($data_AuthorCreateInput_0: AuthorCreateInput!) {
				mut: createAuthor(data: $data_AuthorCreateInput_0) {
					ok
					errorMessage
					errors {
						... MutationError
					}
					validation {
						... ValidationResult
					}
					node {
						id
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "data_AuthorCreateInput_0": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			}
		`)
	})

	test('update', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
			},
		})
		await client.mutate(qb.update('Author', {
			by: { id: 1 },
			data: {
				name: 'John',
				email: 'xx@localhost',
			},
		}))
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($by_AuthorUniqueWhere_0: AuthorUniqueWhere!, $data_AuthorUpdateInput_1: AuthorUpdateInput!) {
				mut: updateAuthor(by: $by_AuthorUniqueWhere_0, data: $data_AuthorUpdateInput_1) {
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "by_AuthorUniqueWhere_0": {
			    "id": 1,
			  },
			  "data_AuthorUpdateInput_1": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			}
		`)
	})

	test('delete', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
			},
		})
		await client.mutate(qb.delete('Author', {
			by: { id: 1 },
		}))
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($by_AuthorUniqueWhere_0: AuthorUniqueWhere!) {
				mut: deleteAuthor(by: $by_AuthorUniqueWhere_0) {
					ok
					errorMessage
					errors {
						... MutationError
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
			"
		`)
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "by_AuthorUniqueWhere_0": {
			    "id": 1,
			  },
			}
		`)
	})

	test('upsert', async () => {
		const [client, calls] = createClient({
			mut: {
				ok: true,
			},
		})
		await client.mutate(qb.upsert('Author', {
			by: { id: 1 },
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
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($by_AuthorUniqueWhere_0: AuthorUniqueWhere!, $create_AuthorCreateInput_1: AuthorCreateInput!, $update_AuthorUpdateInput_2: AuthorUpdateInput!) {
				mut: upsertAuthor(by: $by_AuthorUniqueWhere_0, create: $create_AuthorCreateInput_1, update: $update_AuthorUpdateInput_2) {
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "by_AuthorUniqueWhere_0": {
			    "id": 1,
			  },
			  "create_AuthorCreateInput_1": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			  "update_AuthorUpdateInput_2": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			}
		`)
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
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($data_AuthorCreateInput_0: AuthorCreateInput!, $data_AuthorCreateInput_1: AuthorCreateInput!) {
				mut_0: createAuthor(data: $data_AuthorCreateInput_0) {
					ok
					errorMessage
					errors {
						... MutationError
					}
					validation {
						... ValidationResult
					}
				}
				mut_1: createAuthor(data: $data_AuthorCreateInput_1) {
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "data_AuthorCreateInput_0": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			  "data_AuthorCreateInput_1": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			}
		`)
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
					title: 'Hello',
					content: 'World',
				},
			}),
		})
		expect(result.createAuthor.ok).toBe(true)
		expect(result.createPost.ok).toBe(true)
		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($data_AuthorCreateInput_0: AuthorCreateInput!, $data_PostCreateInput_1: PostCreateInput!) {
				createAuthor(data: $data_AuthorCreateInput_0) {
					ok
					errorMessage
					errors {
						... MutationError
					}
					validation {
						... ValidationResult
					}
				}
				createPost(data: $data_PostCreateInput_1) {
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "data_AuthorCreateInput_0": {
			    "email": "xx@localhost",
			    "name": "John",
			  },
			  "data_PostCreateInput_1": {
			    "content": "World",
			    "title": "Hello",
			  },
			}
		`)
	})

	test('mutation and query combo', async () => {
		const [client, calls] = createClient({
			createPost: {
				ok: true,
			},
			post: {
				value: {
					id: 1,
					title: 'Foo bar',
					content: 'Hello world',
				},
			},
		})

		const result = await client.mutate({
			createPost: qb.create('Post', {
				data: {
					title: 'Hello',
					content: 'World',
				},
			}),
			post: qb.get('Post', {
				by: { id: 1 },
			}, it => it.$$()),
		})
		expect(result.createPost.ok).toBe(true)
		expect(result.post?.title).toBe('Foo bar')

		expect(calls).toHaveLength(1)
		expect(calls[0].query).toMatchInlineSnapshot(`
			"mutation($data_PostCreateInput_0: PostCreateInput!, $by_PostUniqueWhere_1: PostUniqueWhere!) {
				createPost(data: $data_PostCreateInput_0) {
					ok
					errorMessage
					errors {
						... MutationError
					}
					validation {
						... ValidationResult
					}
				}
				post: query {
					value: getPost(by: $by_PostUniqueWhere_1) {
						title
						content
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
		expect(calls[0].variables).toMatchInlineSnapshot(`
			{
			  "by_PostUniqueWhere_1": {
			    "id": 1,
			  },
			  "data_PostCreateInput_0": {
			    "content": "World",
			    "title": "Hello",
			  },
			}
		`)
	})

})
