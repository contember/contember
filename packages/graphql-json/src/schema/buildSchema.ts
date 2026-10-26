/**
 * Build compact Schema from GraphQL SDL string
 */

import { Kind, parse, valueFromASTUntyped } from 'graphql'
import type {
	DirectiveDefinitionNode,
	DocumentNode,
	EnumValueDefinitionNode,
	FieldDefinitionNode,
	InputValueDefinitionNode,
	TypeDefinitionNode,
} from 'graphql'
import type { Argument, Directive, EnumValue, Field, InputField, Schema, Type } from '../types/schema.js'
import { TypeKind } from '../types/schema.js'
import { typeRefFromAST } from '../utils/typeRef.js'
import { isSpecifiedScalarTypeName, specifiedScalarTypes } from '../scalars/builtIn.js'

/**
 * Build a Schema from a GraphQL SDL string
 */
export function buildSchema(source: string): Schema {
	const document = parse(source)
	return buildSchemaFromAST(document)
}

/**
 * Build a Schema from a parsed GraphQL DocumentNode
 */
export function buildSchemaFromAST(document: DocumentNode): Schema {
	const types: Record<string, Type> = {}
	const directives: Record<string, Directive> = {}

	let queryType: string | null = null
	let mutationType: string | null = null
	let subscriptionType: string | null = null

	// First pass: collect all type definitions
	for (const definition of document.definitions) {
		if (definition.kind === Kind.SCHEMA_DEFINITION) {
			for (const operationType of definition.operationTypes) {
				const typeName = operationType.type.name.value
				switch (operationType.operation) {
					case 'query':
						queryType = typeName
						break
					case 'mutation':
						mutationType = typeName
						break
					case 'subscription':
						subscriptionType = typeName
						break
				}
			}
		} else if (isTypeDefinitionNode(definition)) {
			const name = definition.name.value
			// as in graphql-js, a definition of a specified scalar does not replace it
			types[name] = isSpecifiedScalarTypeName(name) ? specifiedScalarTypes[name] : buildType(definition)
		} else if (definition.kind === Kind.DIRECTIVE_DEFINITION) {
			const [name, directive] = buildDirective(definition)
			directives[name] = directive
		}
	}

	// Add built-in scalars if not defined
	for (const [name, scalar] of Object.entries(specifiedScalarTypes)) {
		if (!types[name]) {
			types[name] = scalar
		}
	}

	// Default to 'Query' if no schema definition
	if (!queryType && types['Query']) {
		queryType = 'Query'
	}
	if (!mutationType && types['Mutation']) {
		mutationType = 'Mutation'
	}
	if (!subscriptionType && types['Subscription']) {
		subscriptionType = 'Subscription'
	}

	if (!queryType) {
		throw new Error('Must provide a Query type')
	}

	// Second pass: resolve interface implementations and possibleTypes
	resolveInterfaceImplementations(types)

	return {
		q: queryType,
		m: mutationType,
		s: subscriptionType,
		t: types,
		...(Object.keys(directives).length > 0 && { d: directives }),
	}
}

function isTypeDefinitionNode(node: { kind: string }): node is TypeDefinitionNode {
	return (
		node.kind === Kind.SCALAR_TYPE_DEFINITION
		|| node.kind === Kind.OBJECT_TYPE_DEFINITION
		|| node.kind === Kind.INTERFACE_TYPE_DEFINITION
		|| node.kind === Kind.UNION_TYPE_DEFINITION
		|| node.kind === Kind.ENUM_TYPE_DEFINITION
		|| node.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION
	)
}

function buildType(node: TypeDefinitionNode): Type {
	const description = node.description?.value

	switch (node.kind) {
		case Kind.SCALAR_TYPE_DEFINITION:
			if (description) {
				return [TypeKind.SCALAR, description]
			}
			return [TypeKind.SCALAR]

		case Kind.OBJECT_TYPE_DEFINITION: {
			const fields: Record<string, Field> = {}
			for (const field of node.fields ?? []) {
				fields[field.name.value] = buildField(field)
			}
			const interfaces = node.interfaces?.map((i) => i.name.value) ?? []
			if (description) {
				return [TypeKind.OBJECT, fields, interfaces, description]
			}
			return [TypeKind.OBJECT, fields, interfaces]
		}

		case Kind.INTERFACE_TYPE_DEFINITION: {
			const fields: Record<string, Field> = {}
			for (const field of node.fields ?? []) {
				fields[field.name.value] = buildField(field)
			}
			const interfaces = node.interfaces?.map((i) => i.name.value) ?? []
			const possibleTypes: string[] = [] // Will be filled in second pass
			if (description) {
				return [TypeKind.INTERFACE, fields, interfaces, possibleTypes, description]
			}
			return [TypeKind.INTERFACE, fields, interfaces, possibleTypes]
		}

		case Kind.UNION_TYPE_DEFINITION: {
			const possibleTypes = node.types?.map((t) => t.name.value) ?? []
			if (description) {
				return [TypeKind.UNION, possibleTypes, description]
			}
			return [TypeKind.UNION, possibleTypes]
		}

		case Kind.ENUM_TYPE_DEFINITION: {
			const values: Record<string, EnumValue> = {}
			for (const value of node.values ?? []) {
				values[value.name.value] = buildEnumValue(value)
			}
			if (description) {
				return [TypeKind.ENUM, values, description]
			}
			return [TypeKind.ENUM, values]
		}

		case Kind.INPUT_OBJECT_TYPE_DEFINITION: {
			const fields: Record<string, InputField> = {}
			for (const field of node.fields ?? []) {
				fields[field.name.value] = buildInputField(field)
			}
			const isOneOf = node.directives?.some((d) => d.name.value === 'oneOf') ?? false
			if (description) {
				return [TypeKind.INPUT_OBJECT, fields, isOneOf || undefined, description]
			}
			if (isOneOf) {
				return [TypeKind.INPUT_OBJECT, fields, true]
			}
			return [TypeKind.INPUT_OBJECT, fields]
		}
	}
}

/**
 * Build Field: [typeRef, args, description?, deprecationReason?]
 */
function buildField(node: FieldDefinitionNode): Field {
	const typeRef = typeRefFromAST(node.type)

	const args: Record<string, Argument> | null = node.arguments && node.arguments.length > 0
		? Object.fromEntries(node.arguments.map((arg) => [arg.name.value, buildArgument(arg)]))
		: null

	const description = node.description?.value

	const deprecatedDirective = node.directives?.find((d) => d.name.value === 'deprecated')
	const deprecationReason = deprecatedDirective
		? getDeprecationReason(deprecatedDirective)
		: undefined

	// Build field array, omitting trailing undefined values
	if (deprecationReason) {
		return [typeRef, args, description, deprecationReason]
	}
	if (description) {
		return [typeRef, args, description]
	}
	return [typeRef, args]
}

/**
 * Build Argument: [typeRef, defaultValue?, description?]
 */
function buildArgument(node: InputValueDefinitionNode): Argument {
	const typeRef = typeRefFromAST(node.type)
	const defaultValue = node.defaultValue ? valueFromASTUntyped(node.defaultValue) : undefined
	const description = node.description?.value

	// Build argument array, omitting trailing undefined values
	if (description) {
		return [typeRef, defaultValue, description]
	}
	if (defaultValue !== undefined) {
		return [typeRef, defaultValue]
	}
	return [typeRef]
}

/**
 * Build InputField: [typeRef, defaultValue?, description?]
 */
function buildInputField(node: InputValueDefinitionNode): InputField {
	return buildArgument(node) // Same structure as Argument
}

/**
 * Build EnumValue: [value?, description?, deprecationReason?]
 */
function buildEnumValue(node: EnumValueDefinitionNode): EnumValue {
	const description = node.description?.value

	const deprecatedDirective = node.directives?.find((d) => d.name.value === 'deprecated')
	const deprecationReason = deprecatedDirective
		? getDeprecationReason(deprecatedDirective)
		: undefined

	// Build enum value array, omitting trailing undefined values
	if (deprecationReason) {
		return [undefined, description, deprecationReason]
	}
	if (description) {
		return [undefined, description]
	}
	return []
}

/**
 * Build Directive: [args, locations, isRepeatable?, description?]
 */
function buildDirective(node: DirectiveDefinitionNode): [string, Directive] {
	const name = node.name.value
	const args: Record<string, Argument> = {}
	for (const arg of node.arguments ?? []) {
		args[arg.name.value] = buildArgument(arg)
	}

	const locations = node.locations.map((l) => l.value)
	const isRepeatable = node.repeatable || undefined
	const description = node.description?.value

	// Build directive array, omitting trailing undefined values
	if (description) {
		return [name, [args, locations, isRepeatable, description]]
	}
	if (isRepeatable) {
		return [name, [args, locations, true]]
	}
	return [name, [args, locations]]
}

function getDeprecationReason(
	directive: { arguments?: readonly { name: { value: string }; value: unknown }[] },
): string {
	const reasonArg = directive.arguments?.find((a) => a.name.value === 'reason')
	if (reasonArg?.value && typeof reasonArg.value === 'object' && 'value' in reasonArg.value) {
		return String(reasonArg.value.value)
	}
	return 'No longer supported'
}

function resolveInterfaceImplementations(types: Record<string, Type>): void {
	// For each object type that implements interfaces, add it to the interface's possibleTypes
	for (const [typeName, type] of Object.entries(types)) {
		if (type[0] === TypeKind.OBJECT) {
			// ObjectType: [kind, fields, interfaces, description?]
			const interfaces = type[2]
			for (const interfaceName of interfaces) {
				const interfaceType = types[interfaceName]
				if (interfaceType && interfaceType[0] === TypeKind.INTERFACE) {
					// InterfaceType: [kind, fields, interfaces, possibleTypes, description?]
					const possibleTypes = interfaceType[3]
					if (!possibleTypes.includes(typeName)) {
						possibleTypes.push(typeName)
					}
				}
			}
		}
		// Also handle interface-implements-interface
		if (type[0] === TypeKind.INTERFACE) {
			// InterfaceType: [kind, fields, interfaces, possibleTypes, description?]
			const interfaces = type[2]
			for (const interfaceName of interfaces) {
				const parentInterface = types[interfaceName]
				if (parentInterface && parentInterface[0] === TypeKind.INTERFACE) {
					const possibleTypes = parentInterface[3]
					if (!possibleTypes.includes(typeName)) {
						possibleTypes.push(typeName)
					}
				}
			}
		}
	}
}
