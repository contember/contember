# @contember/graphql-json

GraphQL execution, validation and introspection over a compact, array-based JSON schema.

It reuses `graphql` (graphql-js) only for parsing, AST types, `visit` and `GraphQLError`. The schema is plain JSON instead of class instances, so it can be precomputed, shipped as a JS module or loaded with `JSON.parse`, with no per-process schema building. Resolvers are passed separately from the schema.

## Usage

```ts
import { parse } from 'graphql'
import { buildSchema, execute, validate } from '@contember/graphql-json'

const schema = buildSchema(`
	type Query {
		user(id: ID!): User
	}
	type User {
		id: ID!
		name: String!
	}
`)

const document = parse('{ user(id: "1") { id name } }')
const errors = validate(schema, document)

const result = await execute({
	schema,
	document,
	resolvers: {
		Query: {
			user: (_, args, ctx) => ctx.db.users.find(it => it.id === args.id),
		},
	},
	contextValue: { db },
})
```

`execute` also accepts `rootValue`, `variableValues`, `operationName`, `scalars` (custom scalar implementations), `typeResolvers` (per abstract type), `isTypeOfResolvers` (per object type) and `fieldResolver` (fallback, defaults to a property lookup). `executeSync` throws when a resolver returns a promise.

The context type flows from `contextValue` to `resolvers`, `typeResolvers`, `isTypeOfResolvers` and `fieldResolver`: pass a `ResolverMap<MyContext>` together with `contextValue: MyContext`. Resolvers typed for a context cannot be passed without a `contextValue`.

Custom scalars follow the graphql-js contract, so a `GraphQLScalarType` can be passed as a `ScalarImplementation` directly. As in graphql-js, `parseValue` or `parseLiteral` signals an invalid value by throwing or by returning `undefined`.

`getArgumentValues(schema, fieldDef, fieldNode, variableValues, scalars)` coerces the AST arguments of a single field outside execution. Pass `withBuiltInScalars(customScalars)` as `scalars`. Variable values are taken as given, so they must already be coerced.

The schema, `resolvers` and `scalars` objects are treated as immutable: derived data (the schema merged with introspection types, merged resolvers and scalars, a reverse type-name index) is memoized per object.

## Schema format

```ts
interface Schema {
	q: string // query type name
	m: string | null // mutation type name
	s: string | null // subscription type name
	t: Record<string, Type> // types by name
	d?: Record<string, Directive> // directives by name
}
```

Each type is a tuple whose first element is its `TypeKind`:

| Kind | Value | Tuple |
|------|-------|-------|
| `SCALAR` | 0 | `[0, description?]` |
| `OBJECT` | 1 | `[1, fields, interfaces, description?]` |
| `INTERFACE` | 2 | `[2, fields, interfaces, possibleTypes, description?]` |
| `UNION` | 3 | `[3, possibleTypes, description?]` |
| `ENUM` | 4 | `[4, values, description?]` |
| `INPUT_OBJECT` | 5 | `[5, inputFields, isOneOf?, description?]` |

Members:

- Field: `[typeRef, args | null, description?, deprecationReason?]`
- Argument and input field: `[typeRef, defaultValue?, description?]`
- Enum value: `[internalValue?, description?, deprecationReason?]` (`[]` when there is no metadata)
- Directive: `[args, locations, isRepeatable?, description?]`

A type reference is `[pattern, typeName]`, where the pattern encodes the list and non-null wrappers as one number (`TypePattern`). Lists may nest up to three levels (patterns 0 to 26). The common ones:

| Pattern | Name | Wrapping |
|---------|------|----------|
| 0 | `T` | `Named` |
| 1 | `T_NN` | `Named!` |
| 2 | `L_T` | `[Named]` |
| 3 | `L_T_NN` | `[Named!]` |
| 4 | `L_T_NN_NN` | `[Named]!` |
| 5 | `L_NN_T_NN` | `[Named!]!` |

`ref`, `typeRefFromAST`, `formatTypeRef`, `getPattern`, `isNonNullType`, `isListType`, `unwrapNonNull` and `getListItemType` build and inspect type references.

A hand-written schema:

```ts
import { TypeKind, TypePattern, type Schema } from '@contember/graphql-json'

const schema: Schema = {
	q: 'Query',
	m: null,
	s: null,
	t: {
		Query: [TypeKind.OBJECT, {
			user: [[TypePattern.T, 'User'], { id: [[TypePattern.T_NN, 'ID']] }],
		}, []],
		User: [TypeKind.OBJECT, {
			id: [[TypePattern.T_NN, 'ID'], null],
			name: [[TypePattern.T_NN, 'String'], null],
		}, []],
		String: [TypeKind.SCALAR],
		ID: [TypeKind.SCALAR],
	},
}
```

## Known gaps

- Validation implements 23 of the 24 specified rules; `OverlappingFieldsCanBeMergedRule` is missing.
- No subscriptions.
- Custom directives are not executed; only `@skip` and `@include` affect execution.
- The schema itself is not validated (`buildSchema` builds it, but nothing checks a hand-written or loaded schema for consistency).
- No `@defer` / `@stream`, no `result.extensions`.
