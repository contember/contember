import { describe, expect, test } from 'bun:test'
import { buildSchema } from '../src/schema/buildSchema.js'
import { execute, executeSync } from '../src/execution/execute.js'
import { GraphQLBoolean, GraphQLFloat, GraphQLID, GraphQLInt, GraphQLString, parse } from 'graphql'
import { A, D, EV, F, IF, isEnumType, isInputObjectType, isInterfaceType, isObjectType, isUnionType, T, TypeKind, TypePattern } from '../src/index.js'

describe('buildSchema', () => {
	test('builds basic schema with Query type', () => {
		const schema = buildSchema(`
      type Query {
        hello: String
      }
    `)

		expect(schema.q).toBe('Query')
		expect(schema.m).toBeNull()
		expect(schema.s).toBeNull()
		expect(schema.t.Query).toBeDefined()
		expect(schema.t.Query[0]).toBe(TypeKind.OBJECT)
	})

	test('builds schema with explicit schema definition', () => {
		const schema = buildSchema(`
      schema {
        query: RootQuery
        mutation: RootMutation
      }
      type RootQuery {
        hello: String
      }
      type RootMutation {
        setHello(value: String!): String
      }
    `)

		expect(schema.q).toBe('RootQuery')
		expect(schema.m).toBe('RootMutation')
	})

	test('builds object types with fields and arguments', () => {
		const schema = buildSchema(`
      type Query {
        user(id: ID!): User
        users(limit: Int = 10, offset: Int): [User!]!
      }
      type User {
        id: ID!
        name: String!
        email: String
      }
    `)

		const queryType = schema.t.Query
		expect(queryType[0]).toBe(TypeKind.OBJECT)
		if (isObjectType(queryType)) {
			// user field argument: id: ID! -> TypeRef [1, 'ID'] (NonNull Named)
			const userField = queryType[1].user
			const idArg = userField[1]!.id
			expect(A.type(idArg)).toEqual([TypePattern.T_NN, 'ID'])

			// users field type: [User!]! -> TypeRef [5, 'User'] (NonNull List NonNull Named)
			const usersField = queryType[1].users
			expect(F.type(usersField)).toEqual([TypePattern.L_NN_T_NN, 'User'])

			// default value for limit argument
			const limitArg = usersField[1]!.limit
			expect(A.defaultValue(limitArg)).toBe(10)
		}
	})

	test('builds interface types', () => {
		const schema = buildSchema(`
      type Query {
        node(id: ID!): Node
      }
      interface Node {
        id: ID!
      }
      type User implements Node {
        id: ID!
        name: String!
      }
      type Post implements Node {
        id: ID!
        title: String!
      }
    `)

		const nodeType = schema.t.Node
		expect(nodeType[0]).toBe(TypeKind.INTERFACE)
		if (isInterfaceType(nodeType)) {
			// possibleTypes is at index [3] for InterfaceType
			expect(T.possibleTypes(nodeType)).toContain('User')
			expect(T.possibleTypes(nodeType)).toContain('Post')
		}

		const userType = schema.t.User
		if (isObjectType(userType)) {
			// interfaces is at index [2] for ObjectType
			expect(T.interfaces(userType)).toContain('Node')
		}
	})

	test('builds union types', () => {
		const schema = buildSchema(`
      type Query {
        search: [SearchResult!]!
      }
      union SearchResult = User | Post
      type User {
        name: String!
      }
      type Post {
        title: String!
      }
    `)

		const unionType = schema.t.SearchResult
		expect(unionType[0]).toBe(TypeKind.UNION)
		if (isUnionType(unionType)) {
			// possibleTypes is at index [1] for UnionType
			expect(T.possibleTypes(unionType)).toEqual(['User', 'Post'])
		}
	})

	test('builds enum types', () => {
		const schema = buildSchema(`
      type Query {
        status: Status
      }
      enum Status {
        ACTIVE
        INACTIVE
        PENDING
      }
    `)

		const enumType = schema.t.Status
		expect(enumType[0]).toBe(TypeKind.ENUM)
		if (isEnumType(enumType)) {
			// values is at index [1] for EnumType
			expect(Object.keys(T.values(enumType))).toEqual(['ACTIVE', 'INACTIVE', 'PENDING'])
		}
	})

	test('builds input object types', () => {
		const schema = buildSchema(`
      type Query {
        users(filter: UserFilter): [User!]!
      }
      input UserFilter {
        name: String
        status: Status = ACTIVE
      }
      enum Status {
        ACTIVE
        INACTIVE
      }
      type User {
        name: String!
      }
    `)

		const inputType = schema.t.UserFilter
		expect(inputType[0]).toBe(TypeKind.INPUT_OBJECT)
		if (isInputObjectType(inputType)) {
			// fields is at index [1] for InputObjectType
			const nameField = T.inputFields(inputType).name
			expect(IF.type(nameField)).toEqual([TypePattern.T, 'String'])

			const statusField = T.inputFields(inputType).status
			expect(IF.defaultValue(statusField)).toBe('ACTIVE')
		}
	})

	test('builds custom scalar types', () => {
		const schema = buildSchema(`
      type Query {
        createdAt: DateTime
      }
      scalar DateTime
    `)

		expect(schema.t.DateTime[0]).toBe(TypeKind.SCALAR)
	})

	test('includes built-in scalars', () => {
		const schema = buildSchema(`
      type Query {
        hello: String
      }
    `)

		expect(schema.t.String[0]).toBe(TypeKind.SCALAR)
		expect(schema.t.Int[0]).toBe(TypeKind.SCALAR)
		expect(schema.t.Float[0]).toBe(TypeKind.SCALAR)
		expect(schema.t.Boolean[0]).toBe(TypeKind.SCALAR)
		expect(schema.t.ID[0]).toBe(TypeKind.SCALAR)
	})

	test('parses deprecation reasons', () => {
		const schema = buildSchema(`
      type Query {
        oldField: String @deprecated(reason: "Use newField instead")
        newField: String
      }
      enum Status {
        ACTIVE
        OLD_STATUS @deprecated(reason: "No longer used")
      }
    `)

		const queryType = schema.t.Query
		if (isObjectType(queryType)) {
			// deprecationReason is at index [3] for Field
			expect(F.deprecationReason(queryType[1].oldField)).toBe('Use newField instead')
			expect(F.deprecationReason(queryType[1].newField)).toBeUndefined()
		}

		const enumType = schema.t.Status
		if (isEnumType(enumType)) {
			// deprecationReason is at index [2] for EnumValue
			expect(EV.deprecationReason(T.values(enumType).OLD_STATUS)).toBe('No longer used')
		}
	})

	test('parses descriptions', () => {
		const schema = buildSchema(`
      """The root query type"""
      type Query {
        """Get a greeting"""
        hello(
          """The name to greet"""
          name: String
        ): String
      }
    `)

		// description for ObjectType is at index [3]
		expect(T.description(schema.t.Query)).toBe('The root query type')
		if (isObjectType(schema.t.Query)) {
			const helloField = schema.t.Query[1].hello
			// description for Field is at index [2]
			expect(F.description(helloField)).toBe('Get a greeting')
			// description for Argument is at index [2]
			expect(A.description(helloField[1]!.name)).toBe('The name to greet')
		}
	})

	test('builds directive definitions', () => {
		const schema = buildSchema(`
      type Query {
        hello: String
      }
      directive @auth(role: String!) on FIELD_DEFINITION
      directive @log repeatable on FIELD_DEFINITION | OBJECT
    `)

		expect(schema.d).toBeDefined()
		const authDirective = schema.d!.auth
		// args is at index [0] for Directive
		expect(A.type(D.args(authDirective).role)).toEqual([TypePattern.T_NN, 'String'])
		// locations is at index [1] for Directive
		expect(D.locations(authDirective)).toEqual(['FIELD_DEFINITION'])

		const logDirective = schema.d!.log
		// isRepeatable is at index [2] for Directive
		expect(D.isRepeatable(logDirective)).toBe(true)
		expect(D.locations(logDirective)).toEqual(['FIELD_DEFINITION', 'OBJECT'])
	})

	test('throws error if no Query type', () => {
		expect(() => buildSchema(`type User { name: String }`)).toThrow('Must provide a Query type')
	})

	test('works with execute function', () => {
		const schema = buildSchema(`
      type Query {
        hello: String!
        add(a: Int!, b: Int!): Int!
      }
    `)

		const result = executeSync({
			schema,
			document: parse(`{ hello add(a: 2, b: 3) }`),
			resolvers: {
				Query: {
					hello: () => 'Hello, World!',
					add: (_: unknown, args: Record<string, unknown>) => (args.a as number) + (args.b as number),
				},
			},
		})

		expect(result.errors).toBeUndefined()
		expect(result.data).toEqual({
			hello: 'Hello, World!',
			add: 5,
		})
	})

	test('works with complex schema and execution', async () => {
		const schema = buildSchema(`
      type Query {
        user(id: ID!): User
        users: [User!]!
      }
      type User {
        id: ID!
        name: String!
        posts: [Post!]!
      }
      type Post {
        id: ID!
        title: String!
        author: User!
      }
    `)

		const users = [
			{ id: '1', name: 'Alice' },
			{ id: '2', name: 'Bob' },
		]
		const posts = [
			{ id: '1', title: 'Hello World', authorId: '1' },
			{ id: '2', title: 'GraphQL is great', authorId: '1' },
		]

		const result = await execute({
			schema,
			document: parse(`
        query {
          users {
            id
            name
            posts {
              title
            }
          }
          user(id: "1") {
            name
          }
        }
      `),
			resolvers: {
				Query: {
					users: () => users,
					user: (_: unknown, args: Record<string, unknown>) => users.find((u) => u.id === args.id),
				},
				User: {
					posts: (user: unknown) => posts.filter((p) => p.authorId === (user as { id: string }).id),
				},
				Post: {
					author: (post: unknown) => users.find((u) => u.id === (post as { authorId: string }).authorId),
				},
			},
		})

		expect(result.errors).toBeUndefined()
		expect(result.data).toEqual({
			users: [
				{ id: '1', name: 'Alice', posts: [{ title: 'Hello World' }, { title: 'GraphQL is great' }] },
				{ id: '2', name: 'Bob', posts: [] },
			],
			user: { name: 'Alice' },
		})
	})
})

describe('specified scalars', () => {
	test('carry the graphql-js descriptions, even when the SDL redefines them', () => {
		const schema = buildSchema('"Custom" scalar String type Query { a: String b: Int c: Float d: Boolean e: ID }')
		for (const scalar of [GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLID]) {
			expect(schema.t[scalar.name]).toEqual([TypeKind.SCALAR, scalar.description ?? undefined])
		}
	})
})
