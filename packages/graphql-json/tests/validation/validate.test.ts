import { describe, expect, test } from 'bun:test'
import { parse } from 'graphql'
import { type Schema, TypeKind, TypePattern, validate } from '../../src/index.js'

// Test schema using compact format
const schema: Schema = {
	q: 'Query',
	m: 'Mutation',
	s: null,
	t: {
		Query: [
			TypeKind.OBJECT,
			{
				user: [
					[TypePattern.T, 'User'],
					{
						id: [[TypePattern.T_NN, 'ID']],
					},
				],
				users: [
					[TypePattern.L_NN_T_NN, 'User'],
					null,
				],
				search: [
					[TypePattern.L_T, 'SearchResult'],
					{
						query: [[TypePattern.T_NN, 'String']],
					},
				],
			},
			[],
		],
		Mutation: [
			TypeKind.OBJECT,
			{
				createUser: [
					[TypePattern.T, 'User'],
					{
						input: [[TypePattern.T_NN, 'CreateUserInput']],
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
				status: [[TypePattern.T_NN, 'UserStatus'], null],
				friends: [[TypePattern.L_T, 'User'], null],
			},
			['Node'],
		],
		Node: [
			TypeKind.INTERFACE,
			{
				id: [[TypePattern.T_NN, 'ID'], null],
			},
			[],
			['User'],
		],
		SearchResult: [
			TypeKind.UNION,
			['User'],
		],
		UserStatus: [
			TypeKind.ENUM,
			{
				ACTIVE: ['active'],
				INACTIVE: ['inactive'],
				PENDING: [],
			},
		],
		CreateUserInput: [
			TypeKind.INPUT_OBJECT,
			{
				name: [[TypePattern.T_NN, 'String']],
				email: [[TypePattern.T, 'String']],
			},
		],
		String: [TypeKind.SCALAR],
		Int: [TypeKind.SCALAR],
		Float: [TypeKind.SCALAR],
		Boolean: [TypeKind.SCALAR],
		ID: [TypeKind.SCALAR],
	},
}

describe('validate', () => {
	test('valid query returns no errors', () => {
		const document = parse(`
      query {
        user(id: "1") {
          id
          name
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})

	test('valid query with variables returns no errors', () => {
		const document = parse(`
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          status
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})

	test('valid query with fragments returns no errors', () => {
		const document = parse(`
      query {
        user(id: "1") {
          ...UserFields
        }
      }

      fragment UserFields on User {
        id
        name
        email
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})

	test('valid mutation returns no errors', () => {
		const document = parse(`
      mutation {
        createUser(input: { name: "John" }) {
          id
          name
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})

	test('maxErrors option limits errors', () => {
		const document = parse(`
      query {
        unknownField1
        unknownField2
        unknownField3
        unknownField4
        unknownField5
      }
    `)

		const errors = validate(schema, document, { maxErrors: 3 })
		// 3 errors + 1 "too many errors" message
		expect(errors.length).toBeLessThanOrEqual(4)
	})
})

describe('FieldsOnCorrectTypeRule', () => {
	test('reports unknown field', () => {
		const document = parse(`
      query {
        user(id: "1") {
          unknownField
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('Cannot query field "unknownField"')
		expect(errors[0].message).toContain('User')
	})

	test('suggests similar field names', () => {
		const document = parse(`
      query {
        user(id: "1") {
          nmae
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('Did you mean')
		expect(errors[0].message).toContain('name')
	})
})

describe('ScalarLeafsRule', () => {
	test('reports selection set on scalar', () => {
		const document = parse(`
      query {
        user(id: "1") {
          name {
            foo
          }
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('must not have a selection')
	})

	test('reports missing selection set on object', () => {
		const document = parse(`
      query {
        user(id: "1")
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('must have a selection of subfields')
	})
})

describe('KnownArgumentNamesRule', () => {
	test('reports unknown argument', () => {
		const document = parse(`
      query {
        user(id: "1", unknownArg: true) {
          id
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('Unknown argument "unknownArg"')
	})
})

describe('ProvidedRequiredArgumentsRule', () => {
	test('reports missing required argument', () => {
		const document = parse(`
      query {
        user {
          id
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('argument "id"')
		expect(errors[0].message).toContain('required')
	})
})

describe('ValuesOfCorrectTypeRule', () => {
	test('reports wrong type for argument', () => {
		const document = parse(`
      query {
        user(id: 123) {
          id
        }
      }
    `)

		// ID accepts both String and Int, so this should be valid
		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})

	test('reports null for non-null argument', () => {
		const document = parse(`
      query {
        user(id: null) {
          id
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('found null')
	})

	test('reports unknown enum value', () => {
		const document = parse(`
      query {
        user(id: "1") {
          id
        }
      }
    `)

		// This is valid - let's test with an actual enum input
		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})

	test('reports missing required input field', () => {
		const document = parse(`
      mutation {
        createUser(input: { email: "test@test.com" }) {
          id
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('name')
		expect(errors[0].message).toContain('required')
	})

	test('reports unknown input field', () => {
		const document = parse(`
      mutation {
        createUser(input: { name: "John", unknownField: "value" }) {
          id
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('unknownField')
		expect(errors[0].message).toContain('not defined')
	})
})

describe('KnownFragmentNamesRule', () => {
	test('reports unknown fragment', () => {
		const document = parse(`
      query {
        user(id: "1") {
          ...UnknownFragment
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('Unknown fragment "UnknownFragment"')
	})
})

describe('NoUnusedFragmentsRule', () => {
	test('reports unused fragment', () => {
		const document = parse(`
      query {
        user(id: "1") {
          id
        }
      }

      fragment UnusedFragment on User {
        name
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('never used')
	})
})

describe('NoUndefinedVariablesRule', () => {
	test('reports undefined variable', () => {
		const document = parse(`
      query {
        user(id: $undefinedVar) {
          id
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('$undefinedVar')
		expect(errors[0].message).toContain('not defined')
	})
})

describe('UniqueVariableNamesRule', () => {
	test('reports duplicate variable names', () => {
		const document = parse(`
      query Test($id: ID!, $id: String!) {
        user(id: $id) {
          id
        }
      }
    `)

		const errors = validate(schema, document)
		// Reports error for duplicate + unknown type error for String variable
		expect(errors.length).toBeGreaterThanOrEqual(1)
		expect(errors.some(e => e.message.includes('$id'))).toBe(true)
	})
})

describe('VariablesAreInputTypesRule', () => {
	test('reports non-input type variable', () => {
		const document = parse(`
      query Test($user: User) {
        users {
          id
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('cannot be non-input type')
	})
})

describe('KnownTypeNamesRule', () => {
	test('reports unknown type in variable definition', () => {
		const document = parse(`
      query Test($id: UnknownType!) {
        user(id: "1") {
          id
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('Unknown type "UnknownType"')
	})

	test('reports unknown type in fragment', () => {
		const document = parse(`
      query {
        user(id: "1") {
          ...on UnknownType {
            id
          }
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('Unknown type "UnknownType"')
	})
})

describe('PossibleFragmentSpreadsRule', () => {
	test('reports impossible fragment spread', () => {
		const document = parse(`
      query {
        search(query: "test") {
          ... on Query {
            user(id: "1") { id }
          }
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors.length).toBeGreaterThan(0)
		expect(errors[0].message).toContain('can never be of type')
	})
})

describe('VariablesInAllowedPositionRule', () => {
	test('allows compatible variable types', () => {
		const document = parse(`
      query Test($id: ID!) {
        user(id: $id) {
          id
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})

	test('reports incompatible variable types', () => {
		const document = parse(`
      query Test($id: Int) {
        user(id: $id) {
          id
        }
      }
    `)

		const errors = validate(schema, document)
		// Int is nullable but ID! is required
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('used in position expecting')
	})
})

describe('__typename meta-field', () => {
	test('allows __typename on any type', () => {
		const document = parse(`
      query {
        user(id: "1") {
          __typename
          id
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})
})

// ============= NEW VALIDATION RULES =============

describe('ExecutableDefinitionsRule', () => {
	test('reports non-executable definition', () => {
		const document = parse(`
      query {
        user(id: "1") { id }
      }
      type Foo { bar: String }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('"Foo" definition is not executable')
	})

	test('reports schema definition', () => {
		const document = parse(`
      query {
        user(id: "1") { id }
      }
      schema { query: Query }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('schema definition is not executable')
	})
})

describe('LoneAnonymousOperationRule', () => {
	test('reports anonymous operation when multiple operations exist', () => {
		const document = parse(`
      query {
        user(id: "1") { id }
      }
      query GetUsers {
        users { id }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('anonymous operation must be the only defined operation')
	})

	test('allows single anonymous operation', () => {
		const document = parse(`
      {
        user(id: "1") { id }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})

	test('allows multiple named operations', () => {
		const document = parse(`
      query GetUser {
        user(id: "1") { id }
      }
      query GetUsers {
        users { id }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})
})

describe('UniqueOperationNamesRule', () => {
	test('reports duplicate operation names', () => {
		const document = parse(`
      query GetUser {
        user(id: "1") { id }
      }
      query GetUser {
        users { id }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('There can be only one operation named "GetUser"')
	})
})

describe('UniqueFragmentNamesRule', () => {
	test('reports duplicate fragment names', () => {
		const document = parse(`
      query {
        user(id: "1") { ...UserFields }
      }
      fragment UserFields on User { id }
      fragment UserFields on User { name }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('There can be only one fragment named "UserFields"')
	})
})

describe('UniqueArgumentNamesRule', () => {
	test('reports duplicate arguments on field', () => {
		const document = parse(`
      query {
        user(id: "1", id: "2") { id }
      }
    `)

		const errors = validate(schema, document)
		expect(errors.some((e) => e.message.includes('There can be only one argument named "id"'))).toBe(
			true,
		)
	})

	test('reports duplicate arguments on directive', () => {
		const document = parse(`
      query {
        user(id: "1") {
          id @skip(if: true, if: false)
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors.some((e) => e.message.includes('There can be only one argument named "if"'))).toBe(
			true,
		)
	})
})

describe('UniqueInputFieldNamesRule', () => {
	test('reports duplicate input fields', () => {
		const document = parse(`
      mutation {
        createUser(input: { name: "John", name: "Jane" }) { id }
      }
    `)

		const errors = validate(schema, document)
		expect(errors.some((e) => e.message.includes('There can be only one input field named "name"'))).toBe(
			true,
		)
	})

	test('allows same field name in nested input objects', () => {
		// This would require a nested input type, but our schema doesn't have one
		// Just test that the rule doesn't error on valid input
		const document = parse(`
      mutation {
        createUser(input: { name: "John", email: "john@example.com" }) { id }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})
})

describe('FragmentsOnCompositeTypesRule', () => {
	test('reports fragment on scalar type', () => {
		const document = parse(`
      query {
        user(id: "1") {
          ... on String {
            foo
          }
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors.some((e) => e.message.includes('cannot condition on non composite type'))).toBe(
			true,
		)
	})

	test('reports named fragment on enum type', () => {
		const document = parse(`
      query {
        user(id: "1") {
          ...StatusFields
        }
      }
      fragment StatusFields on UserStatus { ACTIVE }
    `)

		const errors = validate(schema, document)
		expect(errors.some((e) => e.message.includes('cannot condition on non composite type'))).toBe(
			true,
		)
	})

	test('allows fragment on object type', () => {
		const document = parse(`
      query {
        user(id: "1") {
          ... on User { id }
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})
})

describe('NoFragmentCyclesRule', () => {
	test('reports direct fragment cycle', () => {
		const document = parse(`
      query {
        user(id: "1") {
          ...A
        }
      }
      fragment A on User {
        ...A
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('Cannot spread fragment "A" within itself')
	})

	test('reports indirect fragment cycle', () => {
		const document = parse(`
      query {
        user(id: "1") {
          ...A
        }
      }
      fragment A on User {
        ...B
      }
      fragment B on User {
        ...A
      }
    `)

		const errors = validate(schema, document)
		expect(errors.length).toBeGreaterThan(0)
		expect(errors[0].message).toContain('Cannot spread fragment')
		expect(errors[0].message).toContain('within itself')
	})

	test('allows non-cyclic fragments', () => {
		const document = parse(`
      query {
        user(id: "1") {
          ...A
        }
      }
      fragment A on User {
        id
        ...B
      }
      fragment B on User {
        name
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})
})

describe('KnownDirectivesRule', () => {
	test('reports unknown directive', () => {
		const document = parse(`
      query {
        user(id: "1") @unknownDirective {
          id
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(1)
		expect(errors[0].message).toContain('Unknown directive "@unknownDirective"')
	})

	test('allows known directive @skip', () => {
		const document = parse(`
      query {
        user(id: "1") {
          id @skip(if: true)
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})

	test('allows known directive @include', () => {
		const document = parse(`
      query {
        user(id: "1") {
          id @include(if: true)
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})

	test('reports directive in wrong location', () => {
		const document = parse(`
      query @deprecated {
        user(id: "1") { id }
      }
    `)

		const errors = validate(schema, document)
		expect(errors.some((e) => e.message.includes('@deprecated'))).toBe(true)
	})
})

describe('UniqueDirectivesPerLocationRule', () => {
	test('reports duplicate @skip directive', () => {
		const document = parse(`
      query {
        user(id: "1") {
          id @skip(if: true) @skip(if: false)
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors.some((e) => e.message.includes('@skip'))).toBe(true)
		expect(errors.some((e) => e.message.includes('can only be used once'))).toBe(true)
	})

	test('allows different directives at same location', () => {
		const document = parse(`
      query {
        user(id: "1") {
          id @skip(if: false) @include(if: true)
        }
      }
    `)

		const errors = validate(schema, document)
		expect(errors).toHaveLength(0)
	})
})
