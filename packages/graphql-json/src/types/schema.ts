/**
 * Compact Schema type definitions for GraphQL JSON execution engine
 *
 * Array-based format optimized for small JSON size and fast parsing.
 */

// =============================================================================
// TypeRef - Pattern-based encoding
// =============================================================================

/**
 * TypeRef patterns encode the wrapper sequence as a single number.
 * Pattern ID -> wrapper sequence from outside to inside
 */
export const TypePattern = {
	T: 0, // Named (nullable)
	T_NN: 1, // NonNull<Named> (T!)
	L_T: 2, // List<Named> ([T])
	L_T_NN: 3, // List<NonNull<Named>> ([T!])
	L_T_NN_NN: 4, // NonNull<List<Named>> ([T]!)
	L_NN_T_NN: 5, // NonNull<List<NonNull<Named>>> ([T!]!) - most common for lists
	LL_T: 6, // List<List<Named>> ([[T]])
	LL_T_NN: 7, // List<List<NonNull<Named>>> ([[T!]])
	LL_T_NN_NN: 8, // List<NonNull<List<Named>>> ([[T]!])
	LL_NN_T_NN: 9, // List<NonNull<List<NonNull<Named>>>> ([[T!]!])
	LL_T_NN_NN_NN: 10, // NonNull<List<List<Named>>> ([[T]]!)
	LL_NN_T_NN_NN: 11, // NonNull<List<NonNull<List<Named>>>> ([[T]!]!)
	LL_T_NN_NN_NN_NN: 12, // NonNull<List<List<NonNull<Named>>>> ([[T!]]!)
	LL_NN_T_NN_NN_NN: 13, // NonNull<List<NonNull<List<NonNull<Named>>>>> ([[T!]!]!)
	// 3-level list nesting
	LLL_T: 14, // List<List<List<Named>>> ([[[T]]])
	LLL_T_NN: 15, // List<List<List<NonNull<Named>>>> ([[[T!]]])
	LLL_T_NN_NN: 16, // List<List<NonNull<List<Named>>>> ([[[T]!]])
	LLL_NN_T_NN: 17, // List<List<NonNull<List<NonNull<Named>>>>> ([[[T!]!]])
	LLL_T_NN_NN_NN: 18, // List<NonNull<List<List<Named>>>> ([[[T]]!])
	LLL_T_NN_NN_NN_NN: 19, // NonNull<List<List<List<Named>>>> ([[[T]]]!)
	LLL_NN_T_NN_NN: 20, // List<NonNull<List<NonNull<List<Named>>>>> ([[[T]!]!])
	LLL_NN_T_NN_NN_NN: 21, // NonNull<List<NonNull<List<List<Named>>>>> ([[[T]]!]!)
	LLL_NN_T_NN_NN_NN_NN: 22, // NonNull<List<NonNull<List<NonNull<List<Named>>>>>> ([[[T]!]!]!)
	LLL_T_NN_NN_NN_NN_NN: 23, // NonNull<List<List<NonNull<List<Named>>>>> ([[[T]!]]!)
	LLL_T_NN_NN_NN_NN_NN_NN: 24, // NonNull<List<List<List<NonNull<Named>>>>> ([[[T!]]]!)
	LLL_NN_T_NN_NN_NN_NN_NN: 25, // NonNull<List<NonNull<List<List<NonNull<Named>>>>>> ([[[T!]]!]!)
	LLL_NN_NN_T_NN_NN_NN: 26, // NonNull<List<NonNull<List<NonNull<List<NonNull<Named>>>>>>> ([[[T!]!]!]!)
} as const

export type TypePattern = typeof TypePattern[keyof typeof TypePattern]

/**
 * Type reference as [pattern, typeName]
 * @example [5, "User"] means [User!]!
 */
export type TypeRef = [pattern: number, typeName: string]

// =============================================================================
// Type Kinds - Numeric encoding
// =============================================================================

export const TypeKind = {
	SCALAR: 0,
	OBJECT: 1,
	INTERFACE: 2,
	UNION: 3,
	ENUM: 4,
	INPUT_OBJECT: 5,
} as const

export type TypeKind = typeof TypeKind[keyof typeof TypeKind]

// =============================================================================
// Field, Argument, InputField, EnumValue - Array-based
// =============================================================================

/**
 * Argument: [typeRef, defaultValue?, description?]
 */
export type Argument = [
	type: TypeRef,
	defaultValue?: unknown,
	description?: string,
]

/**
 * InputField: [typeRef, defaultValue?, description?]
 */
export type InputField = [
	type: TypeRef,
	defaultValue?: unknown,
	description?: string,
]

/**
 * Field: [typeRef, args, description?, deprecationReason?]
 * args is Record<string, Argument> or null if no args
 */
export type Field = [
	type: TypeRef,
	args: Record<string, Argument> | null,
	description?: string,
	deprecationReason?: string,
]

/**
 * EnumValue: [value?, description?, deprecationReason?]
 * Empty array [] for enum value with no metadata
 */
export type EnumValue = [
	value?: unknown,
	description?: string,
	deprecationReason?: string,
]

// =============================================================================
// Type Definitions - Array-based with kind as first element
// =============================================================================

/**
 * ScalarType: [kind, description?]
 */
export type ScalarType = [kind: typeof TypeKind.SCALAR, description?: string]

/**
 * ObjectType: [kind, fields, interfaces, description?]
 */
export type ObjectType = [
	kind: typeof TypeKind.OBJECT,
	fields: Record<string, Field>,
	interfaces: string[],
	description?: string,
]

/**
 * InterfaceType: [kind, fields, interfaces, possibleTypes, description?]
 */
export type InterfaceType = [
	kind: typeof TypeKind.INTERFACE,
	fields: Record<string, Field>,
	interfaces: string[],
	possibleTypes: string[],
	description?: string,
]

/**
 * UnionType: [kind, possibleTypes, description?]
 */
export type UnionType = [
	kind: typeof TypeKind.UNION,
	possibleTypes: string[],
	description?: string,
]

/**
 * EnumType: [kind, values, description?]
 */
export type EnumType = [
	kind: typeof TypeKind.ENUM,
	values: Record<string, EnumValue>,
	description?: string,
]

/**
 * InputObjectType: [kind, fields, isOneOf?, description?]
 */
export type InputObjectType = [
	kind: typeof TypeKind.INPUT_OBJECT,
	fields: Record<string, InputField>,
	isOneOf?: boolean,
	description?: string,
]

/**
 * Union of all type definitions
 */
export type Type =
	| ScalarType
	| ObjectType
	| InterfaceType
	| UnionType
	| EnumType
	| InputObjectType

// =============================================================================
// Directive
// =============================================================================

/**
 * Directive: [args, locations, isRepeatable?, description?]
 */
export type Directive = [
	args: Record<string, Argument>,
	locations: string[],
	isRepeatable?: boolean,
	description?: string,
]

// =============================================================================
// Schema
// =============================================================================

/**
 * Main schema interface with short keys for compact JSON
 */
export interface Schema {
	/** queryType name */
	q: string
	/** mutationType name (null if not defined) */
	m: string | null
	/** subscriptionType name (null if not defined) */
	s: string | null
	/** types map */
	t: Record<string, Type>
	/** directives map (optional) */
	d?: Record<string, Directive>
}

// =============================================================================
// Type Guards
// =============================================================================

export function isScalarType(type: Type): type is ScalarType {
	return type[0] === TypeKind.SCALAR
}

export function isObjectType(type: Type): type is ObjectType {
	return type[0] === TypeKind.OBJECT
}

export function isInterfaceType(type: Type): type is InterfaceType {
	return type[0] === TypeKind.INTERFACE
}

export function isUnionType(type: Type): type is UnionType {
	return type[0] === TypeKind.UNION
}

export function isEnumType(type: Type): type is EnumType {
	return type[0] === TypeKind.ENUM
}

export function isInputObjectType(type: Type): type is InputObjectType {
	return type[0] === TypeKind.INPUT_OBJECT
}

export function isAbstractType(type: Type): type is InterfaceType | UnionType {
	return type[0] === TypeKind.INTERFACE || type[0] === TypeKind.UNION
}

export function isLeafType(type: Type): type is ScalarType | EnumType {
	return type[0] === TypeKind.SCALAR || type[0] === TypeKind.ENUM
}

export function isCompositeType(type: Type): type is ObjectType | InterfaceType | UnionType {
	return type[0] === TypeKind.OBJECT || type[0] === TypeKind.INTERFACE || type[0] === TypeKind.UNION
}

// =============================================================================
// Accessor helpers (for cleaner code)
// =============================================================================

// Field accessors
export const F = {
	type: (f: Field): TypeRef => f[0],
	args: (f: Field): Record<string, Argument> | null => f[1],
	description: (f: Field): string | undefined => f[2],
	deprecationReason: (f: Field): string | undefined => f[3],
} as const

// Argument accessors
export const A = {
	type: (a: Argument): TypeRef => a[0],
	defaultValue: (a: Argument): unknown => a[1],
	description: (a: Argument): string | undefined => a[2],
} as const

// InputField accessors (same as Argument)
export const IF = A

// EnumValue accessors
export const EV = {
	value: (e: EnumValue): unknown => e[0],
	description: (e: EnumValue): string | undefined => e[1],
	deprecationReason: (e: EnumValue): string | undefined => e[2],
} as const

// Type accessors
export const T = {
	kind: (t: Type): TypeKind => t[0],
	// ObjectType/InterfaceType
	fields: (t: ObjectType | InterfaceType | InputObjectType): Record<string, Field> | Record<string, InputField> => t[1] as Record<string, Field>,
	interfaces: (t: ObjectType | InterfaceType): string[] => t[2],
	// InterfaceType/UnionType
	possibleTypes: (t: InterfaceType | UnionType): string[] => {
		if (t[0] === TypeKind.INTERFACE) return t[3]
		return t[1] // UnionType
	},
	// EnumType
	values: (t: EnumType): Record<string, EnumValue> => t[1],
	// InputObjectType
	inputFields: (t: InputObjectType): Record<string, InputField> => t[1],
	isOneOf: (t: InputObjectType): boolean | undefined => t[2],
	// All types
	description: (t: Type): string | undefined => {
		switch (t[0]) {
			case TypeKind.SCALAR:
				return t[1]
			case TypeKind.OBJECT:
				return t[3]
			case TypeKind.INTERFACE:
				return t[4]
			case TypeKind.UNION:
				return t[2]
			case TypeKind.ENUM:
				return t[2]
			case TypeKind.INPUT_OBJECT:
				return t[3]
		}
	},
} as const

// Directive accessors
export const D = {
	args: (d: Directive): Record<string, Argument> => d[0],
	locations: (d: Directive): string[] => d[1],
	isRepeatable: (d: Directive): boolean | undefined => d[2],
	description: (d: Directive): string | undefined => d[3],
} as const

// Schema accessors
export const S = {
	queryType: (s: Schema): string => s.q,
	mutationType: (s: Schema): string | null => s.m,
	subscriptionType: (s: Schema): string | null => s.s,
	types: (s: Schema): Record<string, Type> => s.t,
	directives: (s: Schema): Record<string, Directive> | undefined => s.d,
	getType: (s: Schema, name: string): Type | undefined => s.t[name],
} as const

// TypeRef accessors
export const TR = {
	pattern: (r: TypeRef): number => r[0],
	typeName: (r: TypeRef): string => r[1],
} as const
