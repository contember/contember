/**
 * GraphQL JSON - A fast GraphQL execution engine using compact JSON schema
 */

// Main execute functions
export { execute, executeSync } from './execution/execute.js'

// Schema building
export { buildSchema, buildSchemaFromAST } from './schema/buildSchema.js'

// Types - Schema (compact format)
export type {
	Argument,
	Directive,
	EnumType,
	EnumValue,
	Field,
	InputField,
	InputObjectType,
	InterfaceType,
	ObjectType,
	ScalarType,
	Schema,
	Type,
	TypeRef,
	UnionType,
} from './types/schema.js'

export {
	A,
	D,
	EV,
	// Accessor helpers
	F,
	IF,
	isAbstractType,
	isCompositeType,
	isEnumType,
	isInputObjectType,
	isInterfaceType,
	isLeafType,
	isObjectType,
	isScalarType,
	isUnionType,
	S,
	T,
	TR,
	TypeKind,
	TypePattern,
} from './types/schema.js'

// Types - Resolvers
export type {
	IsTypeOfResolverFn,
	IsTypeOfResolverMap,
	ResolveInfo,
	ResolverFn,
	ResolverMap,
	ScalarImplementation,
	ScalarMap,
	TypeResolverFn,
	TypeResolverMap,
} from './types/resolvers.js'

export { defaultFieldResolver } from './types/resolvers.js'

// Types - Execution
export type { ExecuteArgs, ExecuteArgsWithContext, ExecutionContext, ExecutionResult, FormattedExecutionResult } from './types/execution.js'

// Built-in scalars
export {
	builtInScalars,
	GraphQLBooleanScalar,
	GraphQLFloatScalar,
	GraphQLIDScalar,
	GraphQLIntScalar,
	GraphQLStringScalar,
	isSpecifiedScalarTypeName,
	specifiedScalarTypes,
	withBuiltInScalars,
} from './scalars/builtIn.js'

// Argument coercion
export { getArgumentValues } from './execution/values.js'

// Utilities
export {
	formatTypeRef,
	getListItemType,
	getNamedType,
	getPattern,
	getTypeName,
	isListType,
	isNonNullType,
	ref,
	typeRefFromAST,
	unwrapNonNull,
} from './utils/typeRef.js'

export { addPath, type Path, pathToArray } from './utils/path.js'
export { SchemaInterner } from './utils/schemaInterner.js'
export { toGraphQLJsSchema } from './utils/toGraphQLJsSchema.js'

// Validation
export { validate, type ValidateOptions } from './validation/validate.js'
export { ValidationContext, type ValidationRule } from './validation/ValidationContext.js'
export { TypeInfo, visitWithTypeInfo } from './validation/TypeInfo.js'
export { typeFromAST } from './validation/typeFromAST.js'
export {
	FieldsOnCorrectTypeRule,
	KnownArgumentNamesRule,
	KnownFragmentNamesRule,
	KnownTypeNamesRule,
	MaxIntrospectionDepthRule,
	NoUndefinedVariablesRule,
	NoUnusedFragmentsRule,
	NoUnusedVariablesRule,
	OverlappingFieldsCanBeMergedRule,
	PossibleFragmentSpreadsRule,
	ProvidedRequiredArgumentsRule,
	ScalarLeafsRule,
	SingleFieldSubscriptionsRule,
	specifiedRules,
	UniqueVariableNamesRule,
	ValuesOfCorrectTypeRule,
	VariablesAreInputTypesRule,
	VariablesInAllowedPositionRule,
} from './validation/specifiedRules.js'

// Validation helpers
export { areTypesEqual, didYouMean, isInputType, isOutputType, isTypeSubTypeOf, suggestionList } from './validation/helpers.js'

// Introspection
export {
	builtInDirectives,
	DirectiveLocation,
	getSchemaWithIntrospection,
	IntrospectionTypeKind,
	introspectionTypes,
	isIntrospectionType,
	typeRefToWrapper,
} from './introspection/index.js'

export type { DirectiveLocationValue, IntrospectionTypeKindValue, IntrospectionTypeWrapper } from './introspection/index.js'
