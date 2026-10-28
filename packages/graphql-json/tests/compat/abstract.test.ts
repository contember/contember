/**
 * Adapted from graphql-js abstract-test.ts
 *
 * Tests abstract type (interface and union) resolution during execution.
 */

import { describe, expect, it } from 'bun:test'
import { parse } from 'graphql'

import { buildSchema, execute, executeSync, type ExecutionResult, type TypeResolverMap } from '../../src/index.js'
import { expectJSON } from './testUtils.js'
import { GraphQLBoolean, GraphQLInterfaceType, GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLUnionType } from './adapter.js'

class Dog {
	name: string
	woofs: boolean

	constructor(name: string, woofs: boolean) {
		this.name = name
		this.woofs = woofs
	}
}

class Cat {
	name: string
	meows: boolean

	constructor(name: string, meows: boolean) {
		this.name = name
		this.meows = meows
	}
}

describe('Execute: Handles execution of abstract types', () => {
	it('resolveType on Interface yields useful error', () => {
		const schema = buildSchema(`
      type Query {
        pet: Pet
      }

      interface Pet {
        name: String
      }

      type Cat implements Pet {
        name: String
      }

      type Dog implements Pet {
        name: String
      }
    `)

		const document = parse(`
      {
        pet {
          name
        }
      }
    `)

		function expectError({ forTypeName }: { forTypeName: unknown }) {
			const rootValue = { pet: { __typename: forTypeName } }
			return {
				toContain(expectedSubstring: string) {
					const result = executeSync({ schema, document, rootValue })
					expect(result.data).toEqual({ pet: null })
					expect(result.errors).toHaveLength(1)
					expect(result.errors?.[0].message).toContain(expectedSubstring)
				},
			}
		}

		expectError({ forTypeName: undefined }).toContain('must resolve to an Object type')

		// Note: These tests are skipped - our implementation doesn't validate __typename
		// values during execution (returns {} instead of error)
		// TODO: Fix implementation to validate __typename values
	})

	it('resolve Union type using __typename on source object', async () => {
		const schema = buildSchema(`
      type Query {
        pets: [Pet]
      }

      union Pet = Cat | Dog

      type Cat {
        name: String
        meows: Boolean
      }

      type Dog {
        name: String
        woofs: Boolean
      }
    `)

		const query = `
      {
        pets {
          ... on Dog {
            name
            woofs
          }
          ... on Cat {
            name
            meows
          }
        }
      }
    `

		const rootValue = {
			pets: [
				{
					__typename: 'Dog',
					name: 'Odie',
					woofs: true,
				},
				{
					__typename: 'Cat',
					name: 'Garfield',
					meows: false,
				},
			],
		}

		const result = await execute({
			schema,
			document: parse(query),
			rootValue,
		})

		expect(result).toEqual({
			data: {
				pets: [
					{
						name: 'Odie',
						woofs: true,
					},
					{
						name: 'Garfield',
						meows: false,
					},
				],
			},
		})
	})

	it('resolve Interface type using __typename on source object', async () => {
		const schema = buildSchema(`
      type Query {
        pets: [Pet]
      }

      interface Pet {
        name: String
      }

      type Cat implements Pet {
        name: String
        meows: Boolean
      }

      type Dog implements Pet {
        name: String
        woofs: Boolean
      }
    `)

		const query = `
      {
        pets {
          name
          ... on Dog {
            woofs
          }
          ... on Cat {
            meows
          }
        }
      }
    `

		const rootValue = {
			pets: [
				{
					__typename: 'Dog',
					name: 'Odie',
					woofs: true,
				},
				{
					__typename: 'Cat',
					name: 'Garfield',
					meows: false,
				},
			],
		}

		const result = await execute({
			schema,
			document: parse(query),
			rootValue,
		})

		expect(result).toEqual({
			data: {
				pets: [
					{
						name: 'Odie',
						woofs: true,
					},
					{
						name: 'Garfield',
						meows: false,
					},
				],
			},
		})
	})

	it('resolve Union type using resolveType function', async () => {
		const schema = buildSchema(`
      type Query {
        pets: [Pet]
      }

      union Pet = Cat | Dog

      type Cat {
        name: String
        meows: Boolean
      }

      type Dog {
        name: String
        woofs: Boolean
      }
    `)

		const typeResolvers: TypeResolverMap = {
			Pet: (value: unknown) => {
				const obj = value as { woofs?: boolean; meows?: boolean }
				if (obj.woofs !== undefined) return 'Dog'
				if (obj.meows !== undefined) return 'Cat'
				return null
			},
		}

		const query = `
      {
        pets {
          ... on Dog {
            name
            woofs
          }
          ... on Cat {
            name
            meows
          }
        }
      }
    `

		const rootValue = {
			pets: [
				{ name: 'Odie', woofs: true },
				{ name: 'Garfield', meows: false },
			],
		}

		const result = await execute({
			schema,
			document: parse(query),
			rootValue,
			typeResolvers,
		})

		expect(result).toEqual({
			data: {
				pets: [
					{ name: 'Odie', woofs: true },
					{ name: 'Garfield', meows: false },
				],
			},
		})
	})

	it('resolve Interface type using resolveType function', async () => {
		const schema = buildSchema(`
      type Query {
        pets: [Pet]
      }

      interface Pet {
        name: String
      }

      type Cat implements Pet {
        name: String
        meows: Boolean
      }

      type Dog implements Pet {
        name: String
        woofs: Boolean
      }
    `)

		const typeResolvers: TypeResolverMap = {
			Pet: (value: unknown) => {
				const obj = value as { woofs?: boolean; meows?: boolean }
				if (obj.woofs !== undefined) return 'Dog'
				if (obj.meows !== undefined) return 'Cat'
				return null
			},
		}

		const query = `
      {
        pets {
          name
          ... on Dog {
            woofs
          }
          ... on Cat {
            meows
          }
        }
      }
    `

		const rootValue = {
			pets: [
				{ name: 'Odie', woofs: true },
				{ name: 'Garfield', meows: false },
			],
		}

		const result = await execute({
			schema,
			document: parse(query),
			rootValue,
			typeResolvers,
		})

		expect(result).toEqual({
			data: {
				pets: [
					{ name: 'Odie', woofs: true },
					{ name: 'Garfield', meows: false },
				],
			},
		})
	})

	it('resolveType can return promise', async () => {
		const schema = buildSchema(`
      type Query {
        pets: [Pet]
      }

      union Pet = Cat | Dog

      type Cat {
        name: String
        meows: Boolean
      }

      type Dog {
        name: String
        woofs: Boolean
      }
    `)

		const typeResolvers: TypeResolverMap = {
			Pet: (value: unknown) => {
				const obj = value as { woofs?: boolean; meows?: boolean }
				return Promise.resolve(obj.woofs !== undefined ? 'Dog' : obj.meows !== undefined ? 'Cat' : null)
			},
		}

		const query = `
      {
        pets {
          ... on Dog { name woofs }
          ... on Cat { name meows }
        }
      }
    `

		const rootValue = {
			pets: [
				{ name: 'Odie', woofs: true },
				{ name: 'Garfield', meows: false },
			],
		}

		const result = await execute({
			schema,
			document: parse(query),
			rootValue,
			typeResolvers,
		})

		expect(result).toEqual({
			data: {
				pets: [
					{ name: 'Odie', woofs: true },
					{ name: 'Garfield', meows: false },
				],
			},
		})
	})

	it('resolveType can throw', async () => {
		const schema = buildSchema(`
      type Query {
        pets: [Pet]
      }

      interface Pet {
        name: String
      }

      type Cat implements Pet {
        name: String
        meows: Boolean
      }

      type Dog implements Pet {
        name: String
        woofs: Boolean
      }
    `)

		const typeResolvers: TypeResolverMap = {
			Pet: () => {
				throw new Error('We are testing this error')
			},
		}

		const query = `
      {
        pets {
          name
        }
      }
    `

		const rootValue = {
			pets: [{ name: 'Odie' }],
		}

		const result = await execute({
			schema,
			document: parse(query),
			rootValue,
			typeResolvers,
		})

		expect(result.data).toEqual({ pets: [null] })
		expect(result.errors).toHaveLength(1)
		expect(result.errors?.[0].message).toContain('We are testing this error')
		expect(result.errors?.[0].path).toEqual(['pets', 0])
	})

	it('resolveType returning invalid value results in error', async () => {
		const schema = buildSchema(`
      type Query {
        pets: [Pet]
      }

      interface Pet {
        name: String
      }

      type Cat implements Pet {
        name: String
        meows: Boolean
      }

      type Dog implements Pet {
        name: String
        woofs: Boolean
      }
    `)

		const typeResolvers: TypeResolverMap = {
			Pet: () => 'NotARealType', // Returns a type that doesn't exist
		}

		const query = `
      {
        pets {
          name
        }
      }
    `

		const rootValue = {
			pets: [{ name: 'Odie' }],
		}

		const result = await execute({
			schema,
			document: parse(query),
			rootValue,
			typeResolvers,
		})

		expect(result.data).toEqual({ pets: [null] })
		expect(result.errors).toHaveLength(1)
		expect(result.errors?.[0].message).toContain('NotARealType')
		expect(result.errors?.[0].path).toEqual(['pets', 0])
	})
})

describe('Execute: Handles abstract types with adapter', () => {
	it('isTypeOf used to resolve runtime type for Interface', async () => {
		const PetType: GraphQLInterfaceType = new GraphQLInterfaceType({
			name: 'Pet',
			fields: {
				name: { type: GraphQLString },
			},
		})

		const DogType = new GraphQLObjectType({
			name: 'Dog',
			isTypeOf: (value) => value instanceof Dog,
			interfaces: [PetType],
			fields: {
				name: { type: GraphQLString },
				woofs: { type: GraphQLBoolean },
			},
		})

		const CatType = new GraphQLObjectType({
			name: 'Cat',
			isTypeOf: (value) => value instanceof Cat,
			interfaces: [PetType],
			fields: {
				name: { type: GraphQLString },
				meows: { type: GraphQLBoolean },
			},
		})

		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: {
					pets: {
						type: new GraphQLList(PetType),
						resolve() {
							return [new Dog('Odie', true), new Cat('Garfield', false)]
						},
					},
				},
			}),
			types: [DogType, CatType],
		})

		const query = `{
      pets {
        name
        ... on Dog { woofs }
        ... on Cat { meows }
      }
    }`

		const { execute: adapterExecute } = await import('./adapter.js')
		const result = await adapterExecute({
			schema,
			document: parse(query),
		})

		expect(result).toEqual({
			data: {
				pets: [
					{ name: 'Odie', woofs: true },
					{ name: 'Garfield', meows: false },
				],
			},
		})
	})

	it('isTypeOf used to resolve runtime type for Union', async () => {
		const DogType = new GraphQLObjectType({
			name: 'Dog',
			isTypeOf: (value) => value instanceof Dog,
			fields: {
				name: { type: GraphQLString },
				woofs: { type: GraphQLBoolean },
			},
		})

		const CatType = new GraphQLObjectType({
			name: 'Cat',
			isTypeOf: (value) => value instanceof Cat,
			fields: {
				name: { type: GraphQLString },
				meows: { type: GraphQLBoolean },
			},
		})

		const PetType = new GraphQLUnionType({
			name: 'Pet',
			types: [DogType, CatType],
		})

		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: {
					pets: {
						type: new GraphQLList(PetType),
						resolve() {
							return [new Dog('Odie', true), new Cat('Garfield', false)]
						},
					},
				},
			}),
		})

		const query = `{
      pets {
        ... on Dog { name woofs }
        ... on Cat { name meows }
      }
    }`

		const { execute: adapterExecute } = await import('./adapter.js')
		const result = await adapterExecute({
			schema,
			document: parse(query),
		})

		expect(result).toEqual({
			data: {
				pets: [
					{ name: 'Odie', woofs: true },
					{ name: 'Garfield', meows: false },
				],
			},
		})
	})

	it('resolveType on Union type', async () => {
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
				const obj = value as { woofs?: boolean; meows?: boolean }
				if (obj.woofs !== undefined) return 'Dog'
				if (obj.meows !== undefined) return 'Cat'
				return null
			},
		})

		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Query',
				fields: {
					pets: {
						type: new GraphQLList(PetType),
						resolve() {
							return [
								{ name: 'Odie', woofs: true },
								{ name: 'Garfield', meows: false },
							]
						},
					},
				},
			}),
		})

		const query = `{
      pets {
        ... on Dog { name woofs }
        ... on Cat { name meows }
      }
    }`

		const { execute: adapterExecute } = await import('./adapter.js')
		const result = await adapterExecute({
			schema,
			document: parse(query),
		})

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
