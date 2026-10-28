import { describe, expect, it } from 'bun:test'
import { buildClientSchema, getIntrospectionQuery, parse } from 'graphql'
import { buildSchema, executeSync, TypePattern, typeRefToWrapper } from '../src/index.js'
import type { ResolverMap } from '../src/index.js'

// Test schema with various types
const schema = buildSchema(`
  """A simple user type"""
  type User implements Node {
    id: ID!
    name: String!
    email: String
    age: Int
    posts: [Post!]!
    status: UserStatus!
  }

  type Post implements Node {
    id: ID!
    title: String!
    author: User!
  }

  interface Node {
    id: ID!
  }

  union SearchResult = User | Post

  enum UserStatus {
    """User is active"""
    ACTIVE
    """User is inactive"""
    INACTIVE
    PENDING @deprecated(reason: "Use INACTIVE instead")
  }

  input CreateUserInput {
    name: String!
    email: String
    age: Int
  }

  type Query {
    user(id: ID!): User
    users: [User!]!
    node(id: ID!): Node
    search(query: String!): [SearchResult!]!
    hello: String!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
  }
`)

const resolvers: ResolverMap = {
	Query: {
		hello: () => 'Hello, World!',
		user: (_, args) => ({ id: (args as any).id, name: 'Test User' }),
		users: () => [],
		node: () => null,
		search: () => [],
	},
	Mutation: {
		createUser: (_, args) => ({
			id: '1',
			name: (args as any).input.name,
		}),
	},
	User: {
		__typename: () => 'User',
		posts: () => [],
		status: () => 'ACTIVE',
	},
	Post: {
		__typename: () => 'Post',
	},
	Node: {
		__resolveType: (obj) => (obj as any).__typename ?? null,
	},
	SearchResult: {
		__resolveType: (obj) => (obj as any).__typename ?? null,
	},
}

describe('introspection', () => {
	describe('__schema query', () => {
		it('returns schema metadata', () => {
			const result = executeSync({
				schema,
				document: parse(`
          {
            __schema {
              queryType { name }
              mutationType { name }
              subscriptionType { name }
            }
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toEqual({
				__schema: {
					queryType: { name: 'Query' },
					mutationType: { name: 'Mutation' },
					subscriptionType: null,
				},
			})
		})

		it('returns all types', () => {
			const result = executeSync({
				schema,
				document: parse(`
          {
            __schema {
              types {
                name
                kind
              }
            }
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			const types = (result.data as any).__schema.types

			// Check that we have our defined types
			const typeNames = types.map((t: any) => t.name)
			expect(typeNames).toContain('User')
			expect(typeNames).toContain('Post')
			expect(typeNames).toContain('Node')
			expect(typeNames).toContain('SearchResult')
			expect(typeNames).toContain('UserStatus')
			expect(typeNames).toContain('CreateUserInput')
			expect(typeNames).toContain('Query')
			expect(typeNames).toContain('Mutation')

			// Check introspection types are also included
			expect(typeNames).toContain('__Schema')
			expect(typeNames).toContain('__Type')
			expect(typeNames).toContain('__TypeKind')
		})

		it('returns directives', () => {
			const result = executeSync({
				schema,
				document: parse(`
          {
            __schema {
              directives {
                name
                description
                locations
                isRepeatable
                args {
                  name
                  type { name }
                }
              }
            }
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			const directives = (result.data as any).__schema.directives

			// Check built-in directives
			const directiveNames = directives.map((d: any) => d.name)
			expect(directiveNames).toContain('skip')
			expect(directiveNames).toContain('include')
			expect(directiveNames).toContain('deprecated')

			// Check skip directive details
			const skip = directives.find((d: any) => d.name === 'skip')
			expect(skip.locations).toContain('FIELD')
			expect(skip.isRepeatable).toBe(false)
			expect(skip.args.map((a: any) => a.name)).toContain('if')
		})
	})

	describe('__type query', () => {
		it('returns object type details', () => {
			const result = executeSync({
				schema,
				document: parse(`
          {
            __type(name: "User") {
              name
              kind
              description
              fields {
                name
                type {
                  kind
                  name
                  ofType { kind name }
                }
              }
              interfaces {
                name
              }
            }
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			const type = (result.data as any).__type

			expect(type.name).toBe('User')
			expect(type.kind).toBe('OBJECT')
			expect(type.description).toBe('A simple user type')
			expect(type.interfaces.map((i: any) => i.name)).toContain('Node')

			// Check fields
			const fieldNames = type.fields.map((f: any) => f.name)
			expect(fieldNames).toContain('id')
			expect(fieldNames).toContain('name')
			expect(fieldNames).toContain('posts')

			// Check non-null field type
			const idField = type.fields.find((f: any) => f.name === 'id')
			expect(idField.type.kind).toBe('NON_NULL')
			expect(idField.type.ofType.name).toBe('ID')
		})

		it('returns interface type details', () => {
			const result = executeSync({
				schema,
				document: parse(`
          {
            __type(name: "Node") {
              name
              kind
              fields { name }
              possibleTypes { name }
            }
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			const type = (result.data as any).__type

			expect(type.name).toBe('Node')
			expect(type.kind).toBe('INTERFACE')
			expect(type.fields.map((f: any) => f.name)).toContain('id')
			expect(type.possibleTypes.map((t: any) => t.name)).toContain('User')
			expect(type.possibleTypes.map((t: any) => t.name)).toContain('Post')
		})

		it('returns union type details', () => {
			const result = executeSync({
				schema,
				document: parse(`
          {
            __type(name: "SearchResult") {
              name
              kind
              possibleTypes { name }
            }
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			const type = (result.data as any).__type

			expect(type.name).toBe('SearchResult')
			expect(type.kind).toBe('UNION')
			expect(type.possibleTypes.map((t: any) => t.name)).toContain('User')
			expect(type.possibleTypes.map((t: any) => t.name)).toContain('Post')
		})

		it('returns enum type details with deprecation', () => {
			const result = executeSync({
				schema,
				document: parse(`
          {
            __type(name: "UserStatus") {
              name
              kind
              enumValues(includeDeprecated: true) {
                name
                description
                isDeprecated
                deprecationReason
              }
            }
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			const type = (result.data as any).__type

			expect(type.name).toBe('UserStatus')
			expect(type.kind).toBe('ENUM')

			const values = type.enumValues
			expect(values.map((v: any) => v.name)).toContain('ACTIVE')
			expect(values.map((v: any) => v.name)).toContain('INACTIVE')
			expect(values.map((v: any) => v.name)).toContain('PENDING')

			const activeValue = values.find((v: any) => v.name === 'ACTIVE')
			expect(activeValue.description).toBe('User is active')
			expect(activeValue.isDeprecated).toBe(false)

			const pendingValue = values.find((v: any) => v.name === 'PENDING')
			expect(pendingValue.isDeprecated).toBe(true)
			expect(pendingValue.deprecationReason).toBe('Use INACTIVE instead')
		})

		it('excludes deprecated enum values by default', () => {
			const result = executeSync({
				schema,
				document: parse(`
          {
            __type(name: "UserStatus") {
              enumValues {
                name
              }
            }
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			const type = (result.data as any).__type

			const valueNames = type.enumValues.map((v: any) => v.name)
			expect(valueNames).toContain('ACTIVE')
			expect(valueNames).toContain('INACTIVE')
			expect(valueNames).not.toContain('PENDING')
		})

		it('returns input object type details', () => {
			const result = executeSync({
				schema,
				document: parse(`
          {
            __type(name: "CreateUserInput") {
              name
              kind
              inputFields {
                name
                type {
                  kind
                  name
                  ofType { name }
                }
                defaultValue
              }
            }
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			const type = (result.data as any).__type

			expect(type.name).toBe('CreateUserInput')
			expect(type.kind).toBe('INPUT_OBJECT')

			const fields = type.inputFields
			expect(fields.map((f: any) => f.name)).toContain('name')
			expect(fields.map((f: any) => f.name)).toContain('email')
			expect(fields.map((f: any) => f.name)).toContain('age')

			const nameField = fields.find((f: any) => f.name === 'name')
			expect(nameField.type.kind).toBe('NON_NULL')
			expect(nameField.type.ofType.name).toBe('String')
		})

		it('returns null for unknown type', () => {
			const result = executeSync({
				schema,
				document: parse(`
          {
            __type(name: "UnknownType") {
              name
            }
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect((result.data as any).__type).toBeNull()
		})

		it('supports variable for type name', () => {
			const result = executeSync({
				schema,
				document: parse(`
          query GetType($name: String!) {
            __type(name: $name) {
              name
              kind
            }
          }
        `),
				resolvers,
				variableValues: { name: 'User' },
			})

			expect(result.errors).toBeUndefined()
			const type = (result.data as any).__type
			expect(type.name).toBe('User')
			expect(type.kind).toBe('OBJECT')
		})
	})

	describe('field arguments', () => {
		it('returns field arguments', () => {
			const result = executeSync({
				schema,
				document: parse(`
          {
            __type(name: "Query") {
              fields {
                name
                args {
                  name
                  type { kind name ofType { kind name } }
                  defaultValue
                }
              }
            }
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			const type = (result.data as any).__type

			const userField = type.fields.find((f: any) => f.name === 'user')
			expect(userField.args.length).toBe(1)
			expect(userField.args[0].name).toBe('id')
			expect(userField.args[0].type.kind).toBe('NON_NULL')
			expect(userField.args[0].type.ofType.name).toBe('ID')
		})
	})

	describe('typeRefToWrapper', () => {
		it('converts simple named type', () => {
			const wrapper = typeRefToWrapper([TypePattern.T, 'User'], schema)

			expect(wrapper.kind).toBe('OBJECT')
			expect(wrapper.name).toBe('User')
			expect(wrapper.ofType).toBeNull()
		})

		it('converts non-null type', () => {
			const wrapper = typeRefToWrapper([TypePattern.T_NN, 'String'], schema)

			expect(wrapper.kind).toBe('NON_NULL')
			expect(wrapper.name).toBeNull()
			expect(wrapper.ofType?.kind).toBe('SCALAR')
			expect(wrapper.ofType?.name).toBe('String')
		})

		it('converts list type', () => {
			const wrapper = typeRefToWrapper([TypePattern.L_T, 'User'], schema)

			expect(wrapper.kind).toBe('LIST')
			expect(wrapper.name).toBeNull()
			expect(wrapper.ofType?.kind).toBe('OBJECT')
			expect(wrapper.ofType?.name).toBe('User')
		})

		it('converts [User!]! type', () => {
			const wrapper = typeRefToWrapper([TypePattern.L_NN_T_NN, 'User'], schema)

			expect(wrapper.kind).toBe('NON_NULL')
			expect(wrapper.ofType?.kind).toBe('LIST')
			expect(wrapper.ofType?.ofType?.kind).toBe('NON_NULL')
			expect(wrapper.ofType?.ofType?.ofType?.kind).toBe('OBJECT')
			expect(wrapper.ofType?.ofType?.ofType?.name).toBe('User')
		})
	})

	describe('full introspection query', () => {
		it('executes the full introspection query', () => {
			const introspectionQuery = getIntrospectionQuery()
			const result = executeSync({
				schema,
				document: parse(introspectionQuery),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect(result.data).toBeDefined()
			expect((result.data as any).__schema).toBeDefined()
			expect((result.data as any).__schema.types).toBeDefined()
			expect((result.data as any).__schema.queryType).toBeDefined()
			expect((result.data as any).__schema.directives).toBeDefined()
		})

		it('produces schema compatible with buildClientSchema', () => {
			const introspectionQuery = getIntrospectionQuery()
			const result = executeSync({
				schema,
				document: parse(introspectionQuery),
				resolvers,
			})

			expect(result.errors).toBeUndefined()

			// This should not throw - if it does, our introspection output is incorrect
			const clientSchema = buildClientSchema(result.data as any)

			// Verify the client schema has the expected types
			expect(clientSchema.getQueryType()?.name).toBe('Query')
			expect(clientSchema.getMutationType()?.name).toBe('Mutation')
			expect(clientSchema.getType('User')).toBeDefined()
			expect(clientSchema.getType('Post')).toBeDefined()
			expect(clientSchema.getType('Node')).toBeDefined()
			expect(clientSchema.getType('SearchResult')).toBeDefined()
			expect(clientSchema.getType('UserStatus')).toBeDefined()
		})
	})

	describe('mixed queries', () => {
		it('can combine introspection with regular queries', () => {
			const result = executeSync({
				schema,
				document: parse(`
          {
            hello
            __schema {
              queryType { name }
            }
            __type(name: "Query") {
              name
            }
          }
        `),
				resolvers,
			})

			expect(result.errors).toBeUndefined()
			expect((result.data as any).hello).toBe('Hello, World!')
			expect((result.data as any).__schema.queryType.name).toBe('Query')
			expect((result.data as any).__type.name).toBe('Query')
		})
	})
})
