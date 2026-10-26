import { describe, expect, it } from 'bun:test'
import { Kind, parse } from 'graphql'
import { execute, executeSync, TypeKind, TypePattern } from '../src/index.js'
import type { ObjectType, ResolverMap, Schema } from '../src/index.js'

import type { ScalarImplementation, TypeResolverMap } from '../src/index.js'

// Test schema
const schema: Schema = {
	q: 'Query',
	m: 'Mutation',
	s: null,
	t: {
		Query: [
			TypeKind.OBJECT,
			{
				hello: [[TypePattern.T_NN, 'String'], null],
				user: [
					[TypePattern.T, 'User'],
					{
						id: [[TypePattern.T_NN, 'ID']],
					},
				],
				users: [[TypePattern.L_NN_T_NN, 'User'], null],
				nullableString: [[TypePattern.T, 'String'], null],
				greeting: [
					[TypePattern.T_NN, 'String'],
					{
						name: [[TypePattern.T_NN, 'String'], 'World'],
					},
				],
				search: [[TypePattern.L_NN_T_NN, 'SearchResult'], null],
			},
			[],
		],
		Mutation: [
			TypeKind.OBJECT,
			{
				createUser: [
					[TypePattern.T_NN, 'User'],
					{
						name: [[TypePattern.T_NN, 'String']],
					},
				],
			},
			[],
		],
		User: [
			TypeKind.OBJECT,
			{
				id: [[TypePattern.T_NN, 'ID'], null],
				name: [[TypePattern.T_NN, 'String'], null],
				email: [[TypePattern.T, 'String'], null],
				age: [[TypePattern.T, 'Int'], null],
				posts: [[TypePattern.L_NN_T_NN, 'Post'], null],
				status: [[TypePattern.T_NN, 'UserStatus'], null],
			},
			['Node'],
		],
		Post: [
			TypeKind.OBJECT,
			{
				id: [[TypePattern.T_NN, 'ID'], null],
				title: [[TypePattern.T_NN, 'String'], null],
				author: [[TypePattern.T_NN, 'User'], null],
			},
			['Node'],
		],
		Node: [
			TypeKind.INTERFACE,
			{
				id: [[TypePattern.T_NN, 'ID'], null],
			},
			[],
			['User', 'Post'],
		],
		SearchResult: [TypeKind.UNION, ['User', 'Post']],
		UserStatus: [
			TypeKind.ENUM,
			{
				ACTIVE: ['active'],
				INACTIVE: ['inactive'],
				PENDING: [],
			},
		],
		String: [TypeKind.SCALAR],
		ID: [TypeKind.SCALAR],
		Int: [TypeKind.SCALAR],
		Float: [TypeKind.SCALAR],
		Boolean: [TypeKind.SCALAR],
		Date: [TypeKind.SCALAR],
	},
}

// Extended schema for additional tests
const extendedSchema: Schema = {
	...schema,
	t: {
		...schema.t,
		Query: [
			TypeKind.OBJECT,
			{
				...(schema.t.Query as ObjectType)[1],
				numbers: [[TypePattern.L_NN_T_NN, 'Int'], null],
				nullableNumbers: [[TypePattern.L_T, 'Int'], null],
				emptyList: [[TypePattern.L_NN_T_NN, 'String'], null],
				nestedList: [[TypePattern.LL_NN_T_NN_NN, 'Int'], null],
				booleanField: [[TypePattern.T_NN, 'Boolean'], null],
				floatField: [[TypePattern.T_NN, 'Float'], null],
				intField: [[TypePattern.T_NN, 'Int'], null],
				idField: [[TypePattern.T_NN, 'ID'], null],
				dateField: [[TypePattern.T_NN, 'Date'], null],
				echo: [
					[TypePattern.T_NN, 'String'],
					{
						message: [[TypePattern.T_NN, 'String']],
					},
				],
				sum: [
					[TypePattern.T_NN, 'Int'],
					{
						a: [[TypePattern.T_NN, 'Int']],
						b: [[TypePattern.T_NN, 'Int']],
					},
				],
				createUserInput: [
					[TypePattern.T_NN, 'User'],
					{
						input: [[TypePattern.T_NN, 'CreateUserInput']],
					},
				],
				node: [
					[TypePattern.T, 'Node'],
					{
						id: [[TypePattern.T_NN, 'ID']],
					},
				],
				contextValue: [[TypePattern.T_NN, 'String'], null],
				rootValue: [[TypePattern.T_NN, 'String'], null],
				parallel: [[TypePattern.L_NN_T_NN, 'String'], null],
			},
			[],
		],
		CreateUserInput: [
			TypeKind.INPUT_OBJECT,
			{
				name: [[TypePattern.T_NN, 'String']],
				email: [[TypePattern.T, 'String']],
				age: [[TypePattern.T, 'Int']],
			},
		],
	},
}

// Test data
const users = [
	{ id: '1', name: 'Alice', email: 'alice@example.com', age: 30, status: 'active' },
	{ id: '2', name: 'Bob', email: null, age: 25, status: 'inactive' },
]

const posts = [
	{ id: '101', title: 'Hello World', authorId: '1' },
	{ id: '102', title: 'GraphQL Rocks', authorId: '1' },
	{ id: '103', title: 'Testing Tips', authorId: '2' },
]

// Resolvers
const resolvers: ResolverMap = {
	Query: {
		hello: () => 'Hello, World!',
		user: (_, { id }) => users.find((u) => u.id === id) ?? null,
		users: () => users,
		nullableString: () => null,
		greeting: (_, { name }) => `Hello, ${name}!`,
		search: () => [
			{ __typename: 'User', ...users[0] },
			{ __typename: 'Post', ...posts[0] },
		],
	},
	Mutation: {
		createUser: (_, { name }) => ({ id: '999', name, email: null, age: null, status: 'PENDING' }),
	},
	User: {
		posts: (user) => posts.filter((p) => p.authorId === (user as (typeof users)[number]).id),
		status: (user) => (user as (typeof users)[number]).status,
	},
	Post: {
		author: (post) => users.find((u) => u.id === (post as (typeof posts)[number]).authorId)!,
	},
}

describe('execute', () => {
	describe('basic queries', () => {
		it('executes a simple query', () => {
			const result = executeSync({
				schema,
				document: parse(`{ hello }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ hello: 'Hello, World!' })
		})

		it('executes query with arguments', () => {
			const result = executeSync({
				schema,
				document: parse(`{ user(id: "1") { id name } }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { id: '1', name: 'Alice' },
			})
		})

		it('handles null results', () => {
			const result = executeSync({
				schema,
				document: parse(`{ user(id: "999") { id name } }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ user: null })
		})

		it('handles nullable fields returning null', () => {
			const result = executeSync({
				schema,
				document: parse(`{ nullableString }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ nullableString: null })
		})
	})

	describe('nested objects', () => {
		it('resolves nested objects', () => {
			const result = executeSync({
				schema,
				document: parse(`{
          user(id: "1") {
            id
            name
            posts {
              id
              title
            }
          }
        }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: {
					id: '1',
					name: 'Alice',
					posts: [
						{ id: '101', title: 'Hello World' },
						{ id: '102', title: 'GraphQL Rocks' },
					],
				},
			})
		})

		it('resolves deeply nested objects', () => {
			const result = executeSync({
				schema,
				document: parse(`{
          user(id: "1") {
            posts {
              author {
                name
              }
            }
          }
        }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: {
					posts: [
						{ author: { name: 'Alice' } },
						{ author: { name: 'Alice' } },
					],
				},
			})
		})
	})

	describe('lists', () => {
		it('resolves list fields', () => {
			const result = executeSync({
				schema,
				document: parse(`{ users { id name } }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				users: [
					{ id: '1', name: 'Alice' },
					{ id: '2', name: 'Bob' },
				],
			})
		})
	})

	describe('arguments and variables', () => {
		it('uses default argument values', () => {
			const result = executeSync({
				schema,
				document: parse(`{ greeting }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ greeting: 'Hello, World!' })
		})

		it('uses provided argument values', () => {
			const result = executeSync({
				schema,
				document: parse(`{ greeting(name: "Alice") }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ greeting: 'Hello, Alice!' })
		})

		it('uses variables', () => {
			const result = executeSync({
				schema,
				document: parse(`query GetUser($id: ID!) { user(id: $id) { id name } }`),
				resolvers,
				variableValues: { id: '2' },
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { id: '2', name: 'Bob' },
			})
		})
	})

	describe('enums', () => {
		it('serializes enum values', () => {
			const result = executeSync({
				schema,
				document: parse(`{ user(id: "1") { status } }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { status: 'ACTIVE' },
			})
		})
	})

	describe('abstract types', () => {
		it('resolves union types using __typename', () => {
			const result = executeSync({
				schema,
				document: parse(`{
          search {
            __typename
            ... on User {
              name
            }
            ... on Post {
              title
            }
          }
        }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				search: [
					{ __typename: 'User', name: 'Alice' },
					{ __typename: 'Post', title: 'Hello World' },
				],
			})
		})
	})

	describe('__typename', () => {
		it('returns __typename for objects', () => {
			const result = executeSync({
				schema,
				document: parse(`{ user(id: "1") { __typename id } }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { __typename: 'User', id: '1' },
			})
		})
	})

	describe('aliases', () => {
		it('supports field aliases', () => {
			const result = executeSync({
				schema,
				document: parse(`{
          first: user(id: "1") { name }
          second: user(id: "2") { name }
        }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				first: { name: 'Alice' },
				second: { name: 'Bob' },
			})
		})
	})

	describe('directives', () => {
		it('supports @skip directive', () => {
			const result = executeSync({
				schema,
				document: parse(`{
          user(id: "1") {
            id
            name @skip(if: true)
          }
        }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { id: '1' },
			})
		})

		it('supports @include directive', () => {
			const result = executeSync({
				schema,
				document: parse(`{
          user(id: "1") {
            id
            name @include(if: false)
          }
        }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { id: '1' },
			})
		})

		it('supports @skip with variables', () => {
			const result = executeSync({
				schema,
				document: parse(`query GetUser($skip: Boolean!) {
          user(id: "1") {
            id
            name @skip(if: $skip)
          }
        }`),
				resolvers,
				variableValues: { skip: true },
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { id: '1' },
			})
		})
	})

	describe('mutations', () => {
		it('executes mutations serially', async () => {
			const result = await execute({
				schema,
				document: parse(`mutation { createUser(name: "Charlie") { id name } }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				createUser: { id: '999', name: 'Charlie' },
			})
		})
	})

	describe('async resolvers', () => {
		it('handles async resolvers', async () => {
			const asyncResolvers: ResolverMap = {
				...resolvers,
				Query: {
					...resolvers.Query,
					hello: async () => {
						await new Promise((resolve) => setTimeout(resolve, 10))
						return 'Async Hello!'
					},
				},
			}

			const result = await execute({
				schema,
				document: parse(`{ hello }`),
				resolvers: asyncResolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ hello: 'Async Hello!' })
		})
	})

	describe('fragments', () => {
		it('supports named fragments', () => {
			const result = executeSync({
				schema,
				document: parse(`
          query {
            user(id: "1") {
              ...UserFields
            }
          }
          fragment UserFields on User {
            id
            name
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { id: '1', name: 'Alice' },
			})
		})

		it('supports inline fragments', () => {
			const result = executeSync({
				schema,
				document: parse(`{
          user(id: "1") {
            ... on User {
              id
              name
            }
          }
        }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { id: '1', name: 'Alice' },
			})
		})
	})

	describe('error handling', () => {
		it('handles resolver errors on nullable fields', () => {
			const errorResolvers: ResolverMap = {
				Query: {
					nullableString: () => {
						throw new Error('Test error')
					},
				},
			}

			const result = executeSync({
				schema,
				document: parse(`{ nullableString }`),
				resolvers: errorResolvers,
			})

			expect(result.errors).toHaveLength(1)
			expect(result.errors![0].message).toBe('Test error')
			expect(result.data).toEqual({ nullableString: null })
		})

		it('propagates errors on non-nullable fields', () => {
			const errorResolvers: ResolverMap = {
				Query: {
					hello: () => {
						throw new Error('Test error')
					},
				},
			}

			const result = executeSync({
				schema,
				document: parse(`{ hello }`),
				resolvers: errorResolvers,
			})

			// Non-null field error propagates to null the entire data
			expect(result.data).toBeNull()
			expect(result.errors).toHaveLength(1)
			expect(result.errors![0].message).toBe('Test error')
			expect(result.errors![0].path).toEqual(['hello'])
		})

		it('handles async resolver errors', async () => {
			const errorResolvers: ResolverMap = {
				Query: {
					nullableString: async () => {
						await new Promise((resolve) => setTimeout(resolve, 5))
						throw new Error('Async error')
					},
				},
			}

			const result = await execute({
				schema,
				document: parse(`{ nullableString }`),
				resolvers: errorResolvers,
			})

			expect(result.errors).toHaveLength(1)
			expect(result.errors![0].message).toBe('Async error')
			expect(result.data).toEqual({ nullableString: null })
		})

		it('includes path in errors', () => {
			const errorResolvers: ResolverMap = {
				...resolvers,
				User: {
					...resolvers.User,
					email: () => {
						throw new Error('Email error')
					},
				},
			}

			const result = executeSync({
				schema,
				document: parse(`{ user(id: "1") { email } }`),
				resolvers: errorResolvers,
			})

			expect(result.errors).toHaveLength(1)
			expect(result.errors![0].path).toEqual(['user', 'email'])
		})

		it('handles multiple errors', () => {
			const errorResolvers: ResolverMap = {
				...resolvers,
				User: {
					email: () => {
						throw new Error('Email error')
					},
					age: () => {
						throw new Error('Age error')
					},
				},
			}

			const result = executeSync({
				schema,
				document: parse(`{ users { email age } }`),
				resolvers: errorResolvers,
			})

			expect(result.errors!.length).toBeGreaterThanOrEqual(2)
			expect(result.data).toEqual({
				users: [
					{ email: null, age: null },
					{ email: null, age: null },
				],
			})
		})
	})

	describe('scalars', () => {
		const extendedResolvers: ResolverMap = {
			...resolvers,
			Query: {
				...resolvers.Query,
				booleanField: () => true,
				floatField: () => 2.71,
				intField: () => 42,
				idField: () => 12345,
				numbers: () => [1, 2, 3],
				emptyList: () => [],
				nullableNumbers: () => [1, null, 3],
			},
		}

		it('serializes boolean values', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{ booleanField }`),
				resolvers: extendedResolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ booleanField: true })
		})

		it('serializes float values', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{ floatField }`),
				resolvers: extendedResolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ floatField: 2.71 })
		})

		it('serializes int values', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{ intField }`),
				resolvers: extendedResolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ intField: 42 })
		})

		it('serializes ID from number', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{ idField }`),
				resolvers: extendedResolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ idField: '12345' })
		})

		it('handles Int coercion from string', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{ intField }`),
				resolvers: {
					Query: { intField: () => '99' as any },
				},
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ intField: 99 })
		})

		it('handles Boolean coercion from number', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{ booleanField }`),
				resolvers: {
					Query: { booleanField: () => 1 as any },
				},
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ booleanField: true })
		})
	})

	describe('custom scalars', () => {
		const dateScalar: ScalarImplementation = {
			serialize: (value) => (value as Date).toISOString(),
			parseValue: (value) => new Date(value as string),
			parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : undefined),
		}

		it('uses custom scalar serialization', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{ dateField }`),
				resolvers: {
					Query: { dateField: () => new Date('2024-01-15T10:30:00Z') },
				},
				scalars: { Date: dateScalar },
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ dateField: '2024-01-15T10:30:00.000Z' })
		})
	})

	describe('lists - extended', () => {
		const extendedResolvers: ResolverMap = {
			...resolvers,
			Query: {
				...resolvers.Query,
				numbers: () => [1, 2, 3],
				emptyList: () => [],
				nullableNumbers: () => [1, null, 3],
				nestedList: () => [[1, 2], [3, 4]],
			},
		}

		it('resolves empty lists', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{ emptyList }`),
				resolvers: extendedResolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ emptyList: [] })
		})

		it('resolves lists with null items', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{ nullableNumbers }`),
				resolvers: extendedResolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ nullableNumbers: [1, null, 3] })
		})

		it('resolves nested lists', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{ nestedList }`),
				resolvers: extendedResolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ nestedList: [[1, 2], [3, 4]] })
		})
	})

	describe('input objects', () => {
		it('handles input object arguments', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{
          createUserInput(input: { name: "Test", email: "test@example.com", age: 25 }) {
            name
            email
            age
          }
        }`),
				resolvers: {
					...resolvers,
					Query: {
						...resolvers.Query,
						createUserInput: (_: any, { input }: any) => ({
							id: '999',
							...input,
							status: 'PENDING',
						}),
					},
				},
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				createUserInput: { name: 'Test', email: 'test@example.com', age: 25 },
			})
		})

		it('handles input object with variables', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`
          query CreateUser($input: CreateUserInput!) {
            createUserInput(input: $input) { name email }
          }
        `),
				resolvers: {
					...resolvers,
					Query: {
						...resolvers.Query,
						createUserInput: (_: any, { input }: any) => ({
							id: '999',
							...input,
							status: 'PENDING',
						}),
					},
				},
				variableValues: {
					input: { name: 'Variable User', email: 'var@example.com' },
				},
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				createUserInput: { name: 'Variable User', email: 'var@example.com' },
			})
		})
	})

	describe('context and root value', () => {
		it('passes context value to resolvers', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{ contextValue }`),
				resolvers: {
					Query: {
						contextValue: (_: any, __: any, context: any) => context.secret,
					},
				},
				contextValue: { secret: 'context-secret-value' },
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ contextValue: 'context-secret-value' })
		})

		it('passes root value to root resolvers', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{ rootValue }`),
				resolvers: {
					Query: {
						rootValue: (root: any) => root.message,
					},
				},
				rootValue: { message: 'root-message-value' },
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ rootValue: 'root-message-value' })
		})
	})

	describe('directives - extended', () => {
		it('combines @skip and @include', () => {
			const result = executeSync({
				schema,
				document: parse(`{
          user(id: "1") {
            id
            name @skip(if: false) @include(if: true)
            email @skip(if: true) @include(if: true)
          }
        }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { id: '1', name: 'Alice' },
			})
		})

		it('applies @skip to fragments', () => {
			const result = executeSync({
				schema,
				document: parse(`
          query GetUser($skipDetails: Boolean!) {
            user(id: "1") {
              id
              ...UserDetails @skip(if: $skipDetails)
            }
          }
          fragment UserDetails on User {
            name
            email
          }
        `),
				resolvers,
				variableValues: { skipDetails: true },
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { id: '1' },
			})
		})

		it('applies @include to inline fragments', () => {
			const result = executeSync({
				schema,
				document: parse(`
          query GetUser($includeDetails: Boolean!) {
            user(id: "1") {
              id
              ... on User @include(if: $includeDetails) {
                name
                email
              }
            }
          }
        `),
				resolvers,
				variableValues: { includeDetails: false },
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { id: '1' },
			})
		})
	})

	describe('fragments - extended', () => {
		it('handles nested fragments', () => {
			const result = executeSync({
				schema,
				document: parse(`
          query {
            user(id: "1") {
              ...UserWithPosts
            }
          }
          fragment UserWithPosts on User {
            ...BasicUser
            posts {
              ...BasicPost
            }
          }
          fragment BasicUser on User {
            id
            name
          }
          fragment BasicPost on Post {
            id
            title
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: {
					id: '1',
					name: 'Alice',
					posts: [
						{ id: '101', title: 'Hello World' },
						{ id: '102', title: 'GraphQL Rocks' },
					],
				},
			})
		})

		it('handles fragment on interface', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`
          query GetNode($id: ID!) {
            node(id: $id) {
              ...NodeFields
              ... on User {
                name
              }
              ... on Post {
                title
              }
            }
          }
          fragment NodeFields on Node {
            id
          }
        `),
				resolvers: {
					...resolvers,
					Query: {
						...resolvers.Query,
						node: (_: any, { id }: any) => {
							const user = users.find((u) => u.id === id)
							if (user) return { __typename: 'User', ...user }
							const post = posts.find((p) => p.id === id)
							if (post) return { __typename: 'Post', ...post }
							return null
						},
					},
				},
				variableValues: { id: '1' },
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				node: { id: '1', name: 'Alice' },
			})
		})

		it('handles overlapping fields from multiple fragments', () => {
			const result = executeSync({
				schema,
				document: parse(`
          query {
            user(id: "1") {
              ...Fragment1
              ...Fragment2
            }
          }
          fragment Fragment1 on User {
            id
            name
          }
          fragment Fragment2 on User {
            id
            email
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { id: '1', name: 'Alice', email: 'alice@example.com' },
			})
		})
	})

	describe('abstract types - extended', () => {
		it('resolves interface types using custom type resolver', () => {
			const typeResolvers: TypeResolverMap = {
				Node: (value: any) => value.__typename,
			}

			const result = executeSync({
				schema: extendedSchema,
				document: parse(`
          query {
            node(id: "1") {
              __typename
              id
              ... on User { name }
            }
          }
        `),
				resolvers: {
					...resolvers,
					Query: {
						...resolvers.Query,
						node: (_: any, { id }: any) => {
							const user = users.find((u) => u.id === id)
							if (user) return { __typename: 'User', ...user }
							return null
						},
					},
				},
				typeResolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				node: { __typename: 'User', id: '1', name: 'Alice' },
			})
		})

		it('handles null abstract type result', () => {
			const result = executeSync({
				schema: extendedSchema,
				document: parse(`{ node(id: "999") { id } }`),
				resolvers: {
					...resolvers,
					Query: {
						...resolvers.Query,
						node: () => null,
					},
				},
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ node: null })
		})
	})

	describe('enums - extended', () => {
		it('serializes enum by internal value', () => {
			const result = executeSync({
				schema,
				document: parse(`{ user(id: "2") { status } }`),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { status: 'INACTIVE' },
			})
		})

		it('serializes enum without internal value', () => {
			const localResolvers: ResolverMap = {
				...resolvers,
				User: {
					...resolvers.User,
					status: () => 'PENDING',
				},
			}

			const result = executeSync({
				schema,
				document: parse(`{ user(id: "1") { status } }`),
				resolvers: localResolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { status: 'PENDING' },
			})
		})
	})

	describe('async - extended', () => {
		it('handles parallel async resolvers', async () => {
			const delay = (ms: number, value: string) => new Promise<string>((resolve) => setTimeout(() => resolve(value), ms))

			const result = await execute({
				schema: extendedSchema,
				document: parse(`{ parallel }`),
				resolvers: {
					Query: {
						parallel: async () => {
							return Promise.all([
								delay(10, 'first'),
								delay(5, 'second'),
								delay(15, 'third'),
							])
						},
					},
				},
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({ parallel: ['first', 'second', 'third'] })
		})

		it('handles nested async resolvers', async () => {
			const asyncResolvers: ResolverMap = {
				Query: {
					user: async (_: any, { id }: any) => {
						await new Promise((resolve) => setTimeout(resolve, 5))
						return users.find((u) => u.id === id)
					},
				},
				User: {
					posts: async (user: any) => {
						await new Promise((resolve) => setTimeout(resolve, 5))
						return posts.filter((p) => p.authorId === user.id)
					},
				},
				Post: {
					author: async (post: any) => {
						await new Promise((resolve) => setTimeout(resolve, 5))
						return users.find((u) => u.id === post.authorId)
					},
				},
			}

			const result = await execute({
				schema,
				document: parse(`{
          user(id: "1") {
            name
            posts {
              title
              author { name }
            }
          }
        }`),
				resolvers: asyncResolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: {
					name: 'Alice',
					posts: [
						{ title: 'Hello World', author: { name: 'Alice' } },
						{ title: 'GraphQL Rocks', author: { name: 'Alice' } },
					],
				},
			})
		})

		it('executeSync throws on async resolver', () => {
			const asyncResolvers: ResolverMap = {
				Query: {
					hello: async () => 'async',
				},
			}

			expect(() => {
				executeSync({
					schema,
					document: parse(`{ hello }`),
					resolvers: asyncResolvers,
				})
			}).toThrow('GraphQL execution failed to complete synchronously')
		})
	})

	describe('mutations - extended', () => {
		it('executes multiple mutations serially', async () => {
			const order: string[] = []

			const mutationResolvers: ResolverMap = {
				...resolvers,
				Mutation: {
					createUser: async (_: any, { name }: any) => {
						order.push(`start:${name}`)
						await new Promise((resolve) => setTimeout(resolve, 10))
						order.push(`end:${name}`)
						return { id: '999', name, email: null, age: null, status: 'PENDING' }
					},
				},
			}

			const result = await execute({
				schema,
				document: parse(`
          mutation {
            first: createUser(name: "First") { name }
            second: createUser(name: "Second") { name }
          }
        `),
				resolvers: mutationResolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				first: { name: 'First' },
				second: { name: 'Second' },
			})
			expect(order).toEqual(['start:First', 'end:First', 'start:Second', 'end:Second'])
		})
	})

	describe('default field resolver', () => {
		it('uses default resolver for missing field resolvers', () => {
			const result = executeSync({
				schema,
				document: parse(`{ user(id: "1") { id name email age } }`),
				resolvers: {
					Query: {
						user: (_: any, { id }: any) => users.find((u) => u.id === id),
					},
					// No User resolvers - should use default field resolver
				},
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				user: { id: '1', name: 'Alice', email: 'alice@example.com', age: 30 },
			})
		})
	})

	describe('operation selection', () => {
		it('executes named operation', () => {
			const result = executeSync({
				schema,
				document: parse(`
          query GetHello { hello }
          query GetUsers { users { id } }
        `),
				resolvers,
				operationName: 'GetUsers',
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				users: [{ id: '1' }, { id: '2' }],
			})
		})

		it('returns error for unknown operation name', () => {
			const result = executeSync({
				schema,
				document: parse(`query GetHello { hello }`),
				resolvers,
				operationName: 'Unknown',
			})

			expect(result.errors).toHaveLength(1)
			expect(result.errors![0].message).toContain('Unknown operation')
		})

		it('returns error for multiple operations without name', () => {
			const result = executeSync({
				schema,
				document: parse(`
          query GetHello { hello }
          query GetUsers { users { id } }
        `),
				resolvers,
			})

			expect(result.errors).toHaveLength(1)
			expect(result.errors![0].message).toContain('operation name')
		})
	})

	describe('resolve info', () => {
		it('provides correct resolve info to resolvers', () => {
			let capturedInfo: any = null

			const result = executeSync({
				schema,
				document: parse(`query TestQuery { user(id: "1") { name } }`),
				resolvers: {
					Query: {
						user: (_: any, __: any, ___: any, info: any) => {
							capturedInfo = info
							return users[0]
						},
					},
				},
			})

			expect(result.errors).toBeUndefined()
			expect(capturedInfo).not.toBeNull()
			expect(capturedInfo.fieldName).toBe('user')
			expect(capturedInfo.parentType).toBe('Query')
			expect(capturedInfo.returnType).toEqual([TypePattern.T, 'User'])
			expect(capturedInfo.operation.operation).toBe('query')
			expect(capturedInfo.variableValues).toEqual({})
		})
	})

	describe('variable coercion', () => {
		// Schema for variable coercion tests
		const coercionSchema: Schema = {
			q: 'Query',
			m: null,
			s: null,
			t: {
				Query: [
					TypeKind.OBJECT,
					{
						intArg: [
							[TypePattern.T_NN, 'Int'],
							{ value: [[TypePattern.T_NN, 'Int']] },
						],
						floatArg: [
							[TypePattern.T_NN, 'Float'],
							{ value: [[TypePattern.T_NN, 'Float']] },
						],
						stringArg: [
							[TypePattern.T_NN, 'String'],
							{ value: [[TypePattern.T_NN, 'String']] },
						],
						booleanArg: [
							[TypePattern.T_NN, 'Boolean'],
							{ value: [[TypePattern.T_NN, 'Boolean']] },
						],
						idArg: [
							[TypePattern.T_NN, 'ID'],
							{ value: [[TypePattern.T_NN, 'ID']] },
						],
						enumArg: [
							[TypePattern.T_NN, 'String'],
							{ value: [[TypePattern.T_NN, 'Status']] },
						],
						listArg: [
							[TypePattern.L_NN_T_NN, 'Int'],
							{ value: [[TypePattern.L_NN_T_NN, 'Int']] },
						],
						nullableListArg: [
							[TypePattern.L_T, 'Int'],
							{ value: [[TypePattern.L_T, 'Int']] },
						],
						inputArg: [
							[TypePattern.T_NN, 'String'],
							{ value: [[TypePattern.T_NN, 'TestInput']] },
						],
						nullableArg: [
							[TypePattern.T, 'String'],
							{ value: [[TypePattern.T, 'String']] },
						],
					},
					[],
				],
				Int: [TypeKind.SCALAR],
				Float: [TypeKind.SCALAR],
				String: [TypeKind.SCALAR],
				Boolean: [TypeKind.SCALAR],
				ID: [TypeKind.SCALAR],
				Status: [
					TypeKind.ENUM,
					{
						ACTIVE: ['active'],
						INACTIVE: ['inactive'],
						PENDING: [],
					},
				],
				TestInput: [
					TypeKind.INPUT_OBJECT,
					{
						name: [[TypePattern.T_NN, 'String']],
						count: [[TypePattern.T, 'Int'], 10],
						tags: [[TypePattern.L_T, 'String']],
					},
				],
			},
		}

		const coercionResolvers: ResolverMap = {
			Query: {
				intArg: (_, { value }) => value,
				floatArg: (_, { value }) => value,
				stringArg: (_, { value }) => value,
				booleanArg: (_, { value }) => value,
				idArg: (_, { value }) => value,
				enumArg: (_, { value }) => value,
				listArg: (_, { value }) => value,
				nullableListArg: (_, { value }) => value ?? null,
				inputArg: (_, { value }) => JSON.stringify(value),
				nullableArg: (_, { value }) => value ?? 'default',
			},
		}

		describe('scalar coercion', () => {
			it('coerces Int variable', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: Int!) { intArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 42 },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ intArg: 42 })
			})

			it('rejects non-integer for Int variable', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: Int!) { intArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 3.14 },
				})
				expect(result.errors).toHaveLength(1)
				expect(result.errors![0].message).toContain('Int cannot represent non-integer')
			})

			it('rejects string for Int variable', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: Int!) { intArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: '42' },
				})
				expect(result.errors).toHaveLength(1)
				expect(result.errors![0].message).toContain('Int cannot represent')
			})

			it('coerces Float variable from integer', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: Float!) { floatArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 42 },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ floatArg: 42 })
			})

			it('coerces Float variable from float', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: Float!) { floatArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 3.14 },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ floatArg: 3.14 })
			})

			it('coerces String variable', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: String!) { stringArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 'hello' },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ stringArg: 'hello' })
			})

			it('rejects non-string for String variable', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: String!) { stringArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 123 },
				})
				expect(result.errors).toHaveLength(1)
				expect(result.errors![0].message).toContain('String cannot represent')
			})

			it('coerces Boolean variable', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: Boolean!) { booleanArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: true },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ booleanArg: true })
			})

			it('rejects non-boolean for Boolean variable', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: Boolean!) { booleanArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 1 },
				})
				expect(result.errors).toHaveLength(1)
				expect(result.errors![0].message).toContain('Boolean cannot represent')
			})

			it('coerces ID variable from string', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: ID!) { idArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 'abc123' },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ idArg: 'abc123' })
			})

			it('coerces ID variable from integer to string', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: ID!) { idArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 123 },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ idArg: '123' })
			})
		})

		describe('non-null handling', () => {
			it('throws error for missing required variable', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: Int!) { intArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: {},
				})
				expect(result.errors).toHaveLength(1)
				expect(result.errors![0].message).toContain('required type')
				expect(result.errors![0].message).toContain('was not provided')
			})

			it('throws error for null value on non-null variable', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: Int!) { intArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: null },
				})
				expect(result.errors).toHaveLength(1)
				expect(result.errors![0].message).toContain('must not be null')
			})

			it('accepts null for nullable variable', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: String) { nullableArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: null },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ nullableArg: 'default' })
			})

			it('uses default value for missing optional variable', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: String = "fallback") { nullableArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: {},
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ nullableArg: 'fallback' })
			})
		})

		describe('list coercion', () => {
			it('coerces array to list type', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: [Int!]!) { listArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: [1, 2, 3] },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ listArg: [1, 2, 3] })
			})

			it('coerces single value to list of one', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: [Int!]!) { listArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 42 },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ listArg: [42] })
			})

			it('handles null items in nullable list', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: [Int]) { nullableListArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: [1, null, 3] },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ nullableListArg: [1, null, 3] })
			})

			it('rejects null items in [Int!] list', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: [Int!]!) { listArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: [1, null, 3] },
				})
				expect(result.errors).toHaveLength(1)
				expect(result.errors![0].message).toContain('not to be null')
			})
		})

		describe('enum coercion', () => {
			it('coerces valid enum value', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: Status!) { enumArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 'ACTIVE' },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ enumArg: 'active' }) // internal value
			})

			it('returns enum name when no internal value defined', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: Status!) { enumArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 'PENDING' },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ enumArg: 'PENDING' }) // no internal value, returns name
			})

			it('rejects invalid enum value', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: Status!) { enumArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 'UNKNOWN' },
				})
				expect(result.errors).toHaveLength(1)
				expect(result.errors![0].message).toContain('does not exist')
				expect(result.errors![0].message).toContain('Status')
			})

			it('rejects non-string for enum variable', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: Status!) { enumArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 1 },
				})
				expect(result.errors).toHaveLength(1)
				expect(result.errors![0].message).toContain('cannot represent non-string')
			})
		})

		describe('input object coercion', () => {
			it('coerces input object fields', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: TestInput!) { inputArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: { name: 'test', count: 5 } },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ inputArg: '{"name":"test","count":5}' })
			})

			it('applies default values for missing optional fields', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: TestInput!) { inputArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: { name: 'test' } },
				})
				expect(result.errors).toBeUndefined()
				// count should be 10 (default)
				expect(result.data).toEqual({ inputArg: '{"name":"test","count":10}' })
			})

			it('throws error for missing required input field', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: TestInput!) { inputArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: { count: 5 } }, // missing name
				})
				expect(result.errors).toHaveLength(1)
				expect(result.errors![0].message).toContain('name')
				expect(result.errors![0].message).toContain('was not provided')
			})

			it('throws error for unknown input field', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: TestInput!) { inputArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: { name: 'test', unknown: 'field' } },
				})
				expect(result.errors).toHaveLength(1)
				expect(result.errors![0].message).toContain('unknown')
				expect(result.errors![0].message).toContain('not defined')
			})

			it('coerces nested list in input object', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: TestInput!) { inputArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: { name: 'test', tags: ['a', 'b'] } },
				})
				expect(result.errors).toBeUndefined()
				expect(result.data).toEqual({ inputArg: '{"name":"test","count":10,"tags":["a","b"]}' })
			})

			it('rejects non-object for input object type', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($v: TestInput!) { inputArg(value: $v) }`),
					resolvers: coercionResolvers,
					variableValues: { v: 'not an object' },
				})
				expect(result.errors).toHaveLength(1)
				expect(result.errors![0].message).toContain('to be an object')
			})
		})

		describe('error collection', () => {
			it('collects multiple variable errors', () => {
				const result = executeSync({
					schema: coercionSchema,
					document: parse(`query ($a: Int!, $b: String!) { intArg(value: $a) stringArg(value: $b) }`),
					resolvers: coercionResolvers,
					variableValues: { a: 'not int', b: 123 },
				})
				expect(result.errors).toHaveLength(2)
				expect(result.errors![0].message).toContain('Int')
				expect(result.errors![1].message).toContain('String')
			})
		})
	})
})
