import { expect } from 'bun:test'
import {
	buildSchema as buildGraphQLJsSchema,
	type GraphQLFormattedError,
	type GraphQLSchema,
	parse,
	validate as validateWithGraphQLJs,
	type ValidationRule as GraphQLJsValidationRule,
} from 'graphql'
import { buildSchema, type Schema, validate, type ValidationRule } from '../../../src/index.js'

/** The schema of the graphql-js validation test suite. */
export const testSchema = `
  interface Mammal {
    mother: Mammal
    father: Mammal
  }

  interface Pet {
    name(surname: Boolean): String
  }

  interface Canine implements Mammal {
    name(surname: Boolean): String
    mother: Canine
    father: Canine
  }

  enum DogCommand {
    SIT
    HEEL
    DOWN
  }

  type Dog implements Pet & Mammal & Canine {
    name(surname: Boolean): String
    nickname: String
    barkVolume: Int
    barks: Boolean
    doesKnowCommand(dogCommand: DogCommand): Boolean
    isHouseTrained(atOtherHomes: Boolean = true): Boolean
    isAtLocation(x: Int, y: Int): Boolean
    mother: Dog
    father: Dog
  }

  type Cat implements Pet {
    name(surname: Boolean): String
    nickname: String
    meows: Boolean
    meowsVolume: Int
    furColor: FurColor
  }

  union CatOrDog = Cat | Dog

  type Human {
    name(surname: Boolean): String
    pets: [Pet]
    relatives: [Human]
  }

  enum FurColor {
    BROWN
    BLACK
    TAN
    SPOTTED
    NO_FUR
    UNKNOWN
  }

  input ComplexInput {
    requiredField: Boolean!
    nonNullField: Boolean! = false
    intField: Int
    stringField: String
    booleanField: Boolean
    stringListField: [String]
  }

  input OneOfInput @oneOf {
    stringField: String
    intField: Int
  }

  type ComplicatedArgs {
    # TODO List
    # TODO Coercion
    # TODO NotNulls
    intArgField(intArg: Int): String
    nonNullIntArgField(nonNullIntArg: Int!): String
    stringArgField(stringArg: String): String
    booleanArgField(booleanArg: Boolean): String
    enumArgField(enumArg: FurColor): String
    floatArgField(floatArg: Float): String
    idArgField(idArg: ID): String
    stringListArgField(stringListArg: [String]): String
    stringListNonNullArgField(stringListNonNullArg: [String!]): String
    complexArgField(complexArg: ComplexInput): String
    oneOfArgField(oneOfArg: OneOfInput): String
    multipleReqs(req1: Int!, req2: Int!): String
    nonNullFieldWithDefault(arg: Int! = 0): String
    multipleOpts(opt1: Int = 0, opt2: Int = 0): String
    multipleOptAndReq(req1: Int!, req2: Int!, opt1: Int = 0, opt2: Int = 0): String
  }

  type QueryRoot {
    human(id: ID): Human
    dog: Dog
    cat: Cat
    pet: Pet
    catOrDog: CatOrDog
    complicatedArgs: ComplicatedArgs
  }

  schema {
    query: QueryRoot
  }

  directive @onField on FIELD
`

/** A graphql-json rule with its graphql-js counterpart, which every validation is compared against. */
export type RulePair = readonly [rule: ValidationRule, graphqlJsRule: GraphQLJsValidationRule]

const schemas = new Map<string, readonly [Schema, GraphQLSchema]>()

function getSchemas(sdl: string): readonly [Schema, GraphQLSchema] {
	let built = schemas.get(sdl)
	if (!built) {
		built = [buildSchema(sdl), buildGraphQLJsSchema(sdl)]
		schemas.set(sdl, built)
	}
	return built
}

export function validateBoth(
	sdl: string,
	rules: ReadonlyArray<RulePair>,
	queryStr: string,
): GraphQLFormattedError[] {
	const [schema, graphqlJsSchema] = getSchemas(sdl)
	const document = parse(queryStr)
	const errors = validate(schema, document, { rules: rules.map(([rule]) => rule) }).map((error) => error.toJSON())
	const graphqlJsErrors = validateWithGraphQLJs(graphqlJsSchema, document, rules.map(([, graphqlJsRule]) => graphqlJsRule))
		.map((error) => error.toJSON())
	expect(errors).toEqual(graphqlJsErrors)
	return errors
}

export function expectValidationErrorsWithSchema(sdl: string, rule: RulePair, queryStr: string) {
	return expect(validateBoth(sdl, [rule], queryStr))
}

export function expectValidationErrors(rule: RulePair, queryStr: string) {
	return expectValidationErrorsWithSchema(testSchema, rule, queryStr)
}
