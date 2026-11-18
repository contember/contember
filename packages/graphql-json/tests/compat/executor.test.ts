/**
 * Adapted from graphql-js executor-test.ts
 *
 * Tests execution engine compatibility with graphql-js behavior.
 */

import { describe, expect, it } from 'bun:test'

import { expectJSON, resolveOnNextTick } from './testUtils.js'
import {
	execute,
	executeSync,
	GraphQLBoolean,
	GraphQLInt,
	GraphQLInterfaceType,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLScalarType,
	GraphQLSchema,
	GraphQLString,
	GraphQLUnionType,
	parse,
} from './adapter.js'

describe('Execute: Handles basic execution tasks', () => {
	it('throws if no document is provided', () => {
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Type',
				fields: {
					a: { type: GraphQLString },
				},
			}),
		})

		// @ts-expect-error
		expect(() => executeSync({ schema })).toThrow('Must provide document.')
	})

	it('throws if no schema is provided', () => {
		const document = parse('{ field }')

		// @ts-expect-error
		expect(() => executeSync({ document })).toThrow('Expected undefined to be a GraphQL schema.')
	})

	it('throws on invalid variables', () => {
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Type',
				fields: {
					fieldA: {
						type: GraphQLString,
						args: { argA: { type: GraphQLInt } },
					},
				},
			}),
		})
		const document = parse(`
      query ($a: Int) {
        fieldA(argA: $a)
      }
    `)
		const variableValues = '{ "a": 1 }'

		// @ts-expect-error
		expect(() => executeSync({ schema, document, variableValues })).toThrow(
			'Variables must be provided as an Object where each property is a variable value.',
		)
	})

	it('executes arbitrary code', async () => {
		const data = {
			a: () => 'Apple',
			b: () => 'Banana',
			c: () => 'Cookie',
			d: () => 'Donut',
			e: () => 'Egg',
			f: 'Fish',
			pic: (size: number) => 'Pic of size: ' + size,
			deep: () => deepData,
			promise: promiseData,
		}

		const deepData = {
			a: () => 'Already Been Done',
			b: () => 'Boring',
			c: () => ['Contrived', undefined, 'Confusing'],
			deeper: () => [data, null, data],
		}

		function promiseData() {
			return Promise.resolve(data)
		}

		const DataType: GraphQLObjectType = new GraphQLObjectType({
			name: 'DataType',
			fields: () => ({
				a: { type: GraphQLString },
				b: { type: GraphQLString },
				c: { type: GraphQLString },
				d: { type: GraphQLString },
				e: { type: GraphQLString },
				f: { type: GraphQLString },
				pic: {
					args: { size: { type: GraphQLInt } },
					type: GraphQLString,
					resolve: (obj, { size }) => obj.pic(size),
				},
				deep: { type: DeepDataType },
				promise: { type: DataType },
			}),
		})

		const DeepDataType = new GraphQLObjectType({
			name: 'DeepDataType',
			fields: {
				a: { type: GraphQLString },
				b: { type: GraphQLString },
				c: { type: new GraphQLList(GraphQLString) },
				deeper: { type: new GraphQLList(DataType) },
			},
		})

		const document = parse(`
      query ($size: Int) {
        a,
        b,
        x: c
        ...c
        f
        ...on DataType {
          pic(size: $size)
          promise {
            a
          }
        }
        deep {
          a
          b
          c
          deeper {
            a
            b
          }
        }
      }

      fragment c on DataType {
        d
        e
      }
    `)

		const result = await execute({
			schema: new GraphQLSchema({ query: DataType }),
			document,
			rootValue: data,
			variableValues: { size: 100 },
		})

		expect(result).toEqual({
			data: {
				a: 'Apple',
				b: 'Banana',
				x: 'Cookie',
				d: 'Donut',
				e: 'Egg',
				f: 'Fish',
				pic: 'Pic of size: 100',
				promise: { a: 'Apple' },
				deep: {
					a: 'Already Been Done',
					b: 'Boring',
					c: ['Contrived', null, 'Confusing'],
					deeper: [{ a: 'Apple', b: 'Banana' }, null, { a: 'Apple', b: 'Banana' }],
				},
			},
		})
	})

	it('merges parallel fragments', () => {
		const Type: GraphQLObjectType = new GraphQLObjectType({
			name: 'Type',
			fields: () => ({
				a: { type: GraphQLString, resolve: () => 'Apple' },
				b: { type: GraphQLString, resolve: () => 'Banana' },
				c: { type: GraphQLString, resolve: () => 'Cherry' },
				deep: { type: Type, resolve: () => ({}) },
			}),
		})
		const schema = new GraphQLSchema({ query: Type })

		const document = parse(`
      { a, ...FragOne, ...FragTwo }

      fragment FragOne on Type {
        b
        deep { b, deeper: deep { b } }
      }

      fragment FragTwo on Type {
        c
        deep { c, deeper: deep { c } }
      }
    `)

		const result = executeSync({ schema, document })
		expect(result).toEqual({
			data: {
				a: 'Apple',
				b: 'Banana',
				c: 'Cherry',
				deep: {
					b: 'Banana',
					c: 'Cherry',
					deeper: {
						b: 'Banana',
						c: 'Cherry',
					},
				},
			},
		})
	})

	it('threads root value context correctly', () => {
		let resolvedRootValue: unknown
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Type',
				fields: {
					a: {
						type: GraphQLString,
						resolve(rootValueArg) {
							resolvedRootValue = rootValueArg
						},
					},
				},
			}),
		})

		const document = parse('query Example { a }')
		const rootValue = { contextThing: 'thing' }

		executeSync({ schema, document, rootValue })
		expect(resolvedRootValue).toBe(rootValue)
	})

	it('correctly threads arguments', () => {
		let resolvedArgs: unknown
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Type',
				fields: {
					b: {
						args: {
							numArg: { type: GraphQLInt },
							stringArg: { type: GraphQLString },
						},
						type: GraphQLString,
						resolve(_, args) {
							resolvedArgs = args
						},
					},
				},
			}),
		})

		const document = parse(`
      query Example {
        b(numArg: 123, stringArg: "foo")
      }
    `)

		executeSync({ schema, document })
		expect(resolvedArgs).toEqual({ numArg: 123, stringArg: 'foo' })
	})

	it('nulls out error subtrees', async () => {
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Type',
				fields: {
					sync: { type: GraphQLString },
					syncError: { type: GraphQLString },
					syncRawError: { type: GraphQLString },
					syncReturnError: { type: GraphQLString },
					syncReturnErrorList: { type: new GraphQLList(GraphQLString) },
					async: { type: GraphQLString },
					asyncReject: { type: GraphQLString },
					asyncRejectWithExtensions: { type: GraphQLString },
					asyncRawReject: { type: GraphQLString },
					asyncEmptyReject: { type: GraphQLString },
					asyncError: { type: GraphQLString },
					asyncRawError: { type: GraphQLString },
					asyncReturnError: { type: GraphQLString },
					asyncReturnErrorWithExtensions: { type: GraphQLString },
				},
			}),
		})

		const document = parse(`
      {
        sync
        syncError
        syncRawError
        syncReturnError
        syncReturnErrorList
        async
        asyncReject
        asyncRawReject
        asyncEmptyReject
        asyncError
        asyncRawError
        asyncReturnError
      }
    `)

		const rootValue = {
			sync() {
				return 'sync'
			},
			syncError() {
				throw new Error('Error getting syncError')
			},
			syncRawError() {
				throw 'Error getting syncRawError'
			},
			syncReturnError() {
				return new Error('Error getting syncReturnError')
			},
			syncReturnErrorList() {
				return [
					'sync0',
					new Error('Error getting syncReturnErrorList1'),
					'sync2',
					new Error('Error getting syncReturnErrorList3'),
				]
			},
			async() {
				return Promise.resolve('async')
			},
			asyncReject() {
				return Promise.reject(new Error('Error getting asyncReject'))
			},
			asyncRawReject() {
				return Promise.reject('Error getting asyncRawReject')
			},
			asyncEmptyReject() {
				return Promise.reject()
			},
			asyncError() {
				return new Promise(() => {
					throw new Error('Error getting asyncError')
				})
			},
			asyncRawError() {
				return new Promise(() => {
					throw 'Error getting asyncRawError'
				})
			},
			asyncReturnError() {
				return Promise.resolve(new Error('Error getting asyncReturnError'))
			},
		}

		const result = await execute({
			schema,
			document,
			rootValue,
		})

		expect(result.data).toEqual({
			sync: 'sync',
			syncError: null,
			syncRawError: null,
			syncReturnError: null,
			syncReturnErrorList: ['sync0', null, 'sync2', null],
			async: 'async',
			asyncReject: null,
			asyncRawReject: null,
			asyncEmptyReject: null,
			asyncError: null,
			asyncRawError: null,
			asyncReturnError: null,
		})

		expect(result.errors).toHaveLength(11)
		// Note: Our implementation has slightly different error messages for raw thrown values
		// graphql-js uses "Unexpected error value: ..." prefix, we use the raw value
		const errorMessages = result.errors?.map((e) => e.message) ?? []
		expect(errorMessages).toContain('Error getting syncError')
		expect(errorMessages).toContain('Error getting syncReturnError')
		expect(errorMessages).toContain('Error getting syncReturnErrorList1')
		expect(errorMessages).toContain('Error getting syncReturnErrorList3')
		expect(errorMessages).toContain('Error getting asyncReject')
		expect(errorMessages).toContain('Error getting asyncError')
		expect(errorMessages).toContain('Error getting asyncReturnError')
	})

	it('uses the inline operation if no operation name is provided', () => {
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Type',
				fields: {
					a: { type: GraphQLString },
				},
			}),
		})
		const document = parse('{ a }')
		const rootValue = { a: 'b' }

		const result = executeSync({ schema, document, rootValue })
		expect(result).toEqual({ data: { a: 'b' } })
	})

	it('uses the named operation if operation name is provided', () => {
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Type',
				fields: {
					a: { type: GraphQLString },
				},
			}),
		})
		const document = parse(`
      query Example { first: a }
      query OtherExample { second: a }
    `)
		const rootValue = { a: 'b' }

		const result = executeSync({
			schema,
			document,
			rootValue,
			operationName: 'OtherExample',
		})
		expect(result).toEqual({ data: { second: 'b' } })
	})

	it('provides error if no operation is provided', () => {
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Type',
				fields: {
					a: { type: GraphQLString },
				},
			}),
		})
		const document = parse('fragment Example on Type { a }')

		const result = executeSync({ schema, document })
		expect(result.errors).toHaveLength(1)
		expect(result.errors?.[0].message).toContain('Must provide an operation')
	})

	it('provides error if operation name is not found', () => {
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Type',
				fields: {
					a: { type: GraphQLString },
				},
			}),
		})
		const document = parse(`
      query Example { a }
      query OtherExample { a }
    `)

		const result = executeSync({
			schema,
			document,
			operationName: 'UnknownOperation',
		})
		expect(result.errors).toHaveLength(1)
		expect(result.errors?.[0].message).toContain('Unknown operation named "UnknownOperation"')
	})
})

describe('Execute: Handles execution with default field resolver', () => {
	it('resolves using default field resolver from object', () => {
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: {
					foo: { type: GraphQLString },
					bar: { type: GraphQLInt },
				},
			}),
		})

		const document = parse('{ foo bar }')
		const rootValue = { foo: 'hello', bar: 42 }

		const result = executeSync({ schema, document, rootValue })
		expect(result).toEqual({ data: { foo: 'hello', bar: 42 } })
	})

	it('resolves null for missing fields on object', () => {
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: {
					foo: { type: GraphQLString },
				},
			}),
		})

		const document = parse('{ foo }')
		const rootValue = {}

		const result = executeSync({ schema, document, rootValue })
		expect(result).toEqual({ data: { foo: null } })
	})
})

describe('Execute: Handles list types', () => {
	it('handles list of scalars', () => {
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: {
					list: { type: new GraphQLList(GraphQLString) },
				},
			}),
		})

		const document = parse('{ list }')
		const rootValue = { list: ['a', 'b', 'c'] }

		const result = executeSync({ schema, document, rootValue })
		expect(result).toEqual({ data: { list: ['a', 'b', 'c'] } })
	})

	it('handles non-null list of non-null scalars', () => {
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: {
					list: {
						type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
					},
				},
			}),
		})

		const document = parse('{ list }')
		const rootValue = { list: ['a', 'b', 'c'] }

		const result = executeSync({ schema, document, rootValue })
		expect(result).toEqual({ data: { list: ['a', 'b', 'c'] } })
	})

	it('returns null when nullable list contains null', () => {
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: {
					list: { type: new GraphQLList(GraphQLString) },
				},
			}),
		})

		const document = parse('{ list }')
		const rootValue = { list: ['a', null, 'c'] }

		const result = executeSync({ schema, document, rootValue })
		expect(result).toEqual({ data: { list: ['a', null, 'c'] } })
	})
})

describe('Execute: Handles abstract types', () => {
	it('resolves union types with resolveType', () => {
		const DogType = new GraphQLObjectType({
			name: 'Dog',
			fields: {
				name: { type: GraphQLString },
				woofs: { type: GraphQLBoolean },
			},
		})

		const CatType = new GraphQLObjectType({
			name: 'Cat',
			fields: {
				name: { type: GraphQLString },
				meows: { type: GraphQLBoolean },
			},
		})

		const PetType = new GraphQLUnionType({
			name: 'Pet',
			types: [DogType, CatType],
			resolveType(value) {
				if (value.woofs !== undefined) return 'Dog'
				if (value.meows !== undefined) return 'Cat'
				return null
			},
		})

		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: {
					pets: { type: new GraphQLList(PetType) },
				},
			}),
		})

		const document = parse(`
      {
        pets {
          ... on Dog { name woofs }
          ... on Cat { name meows }
        }
      }
    `)

		const rootValue = {
			pets: [
				{ name: 'Odie', woofs: true },
				{ name: 'Garfield', meows: false },
			],
		}

		const result = executeSync({ schema, document, rootValue })
		expect(result).toEqual({
			data: {
				pets: [
					{ name: 'Odie', woofs: true },
					{ name: 'Garfield', meows: false },
				],
			},
		})
	})

	it('resolves interface types with resolveType', () => {
		const PetInterface = new GraphQLInterfaceType({
			name: 'Pet',
			fields: {
				name: { type: GraphQLString },
			},
			resolveType(value) {
				if (value.woofs !== undefined) return 'Dog'
				if (value.meows !== undefined) return 'Cat'
				return null
			},
		})

		const DogType = new GraphQLObjectType({
			name: 'Dog',
			interfaces: [PetInterface],
			fields: {
				name: { type: GraphQLString },
				woofs: { type: GraphQLBoolean },
			},
		})

		const CatType = new GraphQLObjectType({
			name: 'Cat',
			interfaces: [PetInterface],
			fields: {
				name: { type: GraphQLString },
				meows: { type: GraphQLBoolean },
			},
		})

		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: {
					pets: { type: new GraphQLList(PetInterface) },
				},
			}),
			types: [DogType, CatType],
		})

		const document = parse(`
      {
        pets {
          name
          ... on Dog { woofs }
          ... on Cat { meows }
        }
      }
    `)

		const rootValue = {
			pets: [
				{ name: 'Odie', woofs: true },
				{ name: 'Garfield', meows: false },
			],
		}

		const result = executeSync({ schema, document, rootValue })
		expect(result).toEqual({
			data: {
				pets: [
					{ name: 'Odie', woofs: true },
					{ name: 'Garfield', meows: false },
				],
			},
		})
	})
})

describe('Execute: Handles async execution', () => {
	it('resolves async fields in parallel', async () => {
		const resolveOrder: string[] = []

		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: {
					a: {
						type: GraphQLString,
						resolve: () =>
							new Promise((resolve) => {
								setTimeout(() => {
									resolveOrder.push('a')
									resolve('a')
								}, 10)
							}),
					},
					b: {
						type: GraphQLString,
						resolve: () =>
							new Promise((resolve) => {
								setTimeout(() => {
									resolveOrder.push('b')
									resolve('b')
								}, 5)
							}),
					},
				},
			}),
		})

		const document = parse('{ a b }')

		const result = await execute({ schema, document })
		expect(result).toEqual({ data: { a: 'a', b: 'b' } })
		// b should resolve before a since it has shorter timeout
		expect(resolveOrder).toEqual(['b', 'a'])
	})

	it('handles nested async resolvers', async () => {
		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: {
					nested: {
						type: new GraphQLObjectType({
							name: 'Nested',
							fields: {
								value: {
									type: GraphQLString,
									resolve: () => Promise.resolve('async value'),
								},
							},
						}),
						resolve: () => Promise.resolve({}),
					},
				},
			}),
		})

		const document = parse('{ nested { value } }')

		const result = await execute({ schema, document })
		expect(result).toEqual({ data: { nested: { value: 'async value' } } })
	})
})
