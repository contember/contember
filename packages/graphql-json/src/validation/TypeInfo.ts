/**
 * TypeInfo - tracks type information during AST traversal
 * Adapted from graphql-js for compact Schema
 */
import type {
	ArgumentNode,
	ASTNode,
	ASTVisitor,
	DirectiveNode,
	EnumValueNode,
	FieldNode,
	FragmentDefinitionNode,
	InlineFragmentNode,
	ObjectFieldNode,
	OperationDefinitionNode,
	VariableDefinitionNode,
} from 'graphql'
import { Kind } from 'graphql'

import type {
	Argument,
	Directive,
	EnumType,
	EnumValue,
	Field,
	InputField,
	InputObjectType,
	InterfaceType,
	ObjectType,
	Schema,
	Type,
	TypeRef,
} from '../types/schema.js'
import { A, D, IF, isCompositeType, isEnumType, isInputObjectType, isInterfaceType, isObjectType, TypePattern } from '../types/schema.js'
import { getListItemType, getTypeName, isListType, isNonNullType, unwrapNonNull } from '../utils/typeRef.js'
import { typeFromAST } from './typeFromAST.js'

type Maybe<T> = T | null | undefined

// Built-in directive definitions for when schema doesn't define them
// Using compact Directive format: [args, locations, isRepeatable?, description?]
const BUILT_IN_DIRECTIVES: Record<string, Directive> = {
	skip: [
		{ if: [[TypePattern.T_NN, 'Boolean']] }, // args: { if: [[1, 'Boolean']] }
		['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'],
	],
	include: [
		{ if: [[TypePattern.T_NN, 'Boolean']] },
		['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'],
	],
	deprecated: [
		{ reason: [[TypePattern.T, 'String'], 'No longer supported'] }, // Argument with default value
		['FIELD_DEFINITION', 'ENUM_VALUE', 'ARGUMENT_DEFINITION', 'INPUT_FIELD_DEFINITION'],
	],
	specifiedBy: [
		{ url: [[TypePattern.T_NN, 'String']] },
		['SCALAR'],
	],
}

/**
 * TypeInfo tracks the current type context during AST traversal.
 * It maintains stacks of types and fields to provide context for validation rules.
 */
export class TypeInfo {
	private _schema: Schema
	private _typeStack: Array<Maybe<TypeRef>>
	private _parentTypeStack: Array<Maybe<Type>>
	private _parentTypeNameStack: Array<Maybe<string>>
	private _inputTypeStack: Array<Maybe<TypeRef>>
	private _fieldDefStack: Array<Maybe<Field>>
	private _defaultValueStack: Array<Maybe<unknown>>
	private _directive: Maybe<Directive>
	private _argument: Maybe<Argument>
	private _enumValue: Maybe<EnumValue>

	constructor(schema: Schema, initialType?: Maybe<TypeRef>) {
		this._schema = schema
		this._typeStack = initialType ? [initialType] : []
		this._parentTypeStack = []
		this._parentTypeNameStack = []
		this._inputTypeStack = []
		this._fieldDefStack = []
		this._defaultValueStack = []
		this._directive = null
		this._argument = null
		this._enumValue = null
	}

	get [Symbol.toStringTag](): string {
		return 'TypeInfo'
	}

	getType(): Maybe<TypeRef> {
		return this._typeStack[this._typeStack.length - 1]
	}

	getParentType(): Maybe<Type> {
		return this._parentTypeStack[this._parentTypeStack.length - 1]
	}

	/** Types are referenced by name, so the name is tracked instead of looked up from the definition. */
	getParentTypeName(): Maybe<string> {
		return this._parentTypeNameStack[this._parentTypeNameStack.length - 1]
	}

	getInputType(): Maybe<TypeRef> {
		return this._inputTypeStack[this._inputTypeStack.length - 1]
	}

	getParentInputType(): Maybe<TypeRef> {
		return this._inputTypeStack[this._inputTypeStack.length - 2]
	}

	getFieldDef(): Maybe<Field> {
		return this._fieldDefStack[this._fieldDefStack.length - 1]
	}

	getDefaultValue(): Maybe<unknown> {
		return this._defaultValueStack[this._defaultValueStack.length - 1]
	}

	getDirective(): Maybe<Directive> {
		return this._directive
	}

	getArgument(): Maybe<Argument> {
		return this._argument
	}

	getEnumValue(): Maybe<EnumValue> {
		return this._enumValue
	}

	enter(node: ASTNode): void {
		const schema = this._schema

		switch (node.kind) {
			case Kind.SELECTION_SET: {
				const namedTypeName = this._getNamedTypeFromTypeRef(this.getType())
				const namedType = namedTypeName ? schema.t[namedTypeName] : undefined
				const compositeType = namedType && isCompositeType(namedType) ? namedType : undefined
				this._parentTypeStack.push(compositeType)
				this._parentTypeNameStack.push(compositeType ? namedTypeName : undefined)
				break
			}

			case Kind.FIELD: {
				const parentType = this.getParentType()
				let fieldDef: Maybe<Field>
				let fieldTypeRef: Maybe<TypeRef>

				if (parentType) {
					fieldDef = this._getFieldDef(parentType, this.getParentTypeName(), (node as FieldNode).name.value)
					if (fieldDef) {
						// Field: [typeRef, args, description?, deprecationReason?]
						fieldTypeRef = fieldDef[0]
					}
				}
				this._fieldDefStack.push(fieldDef)
				this._typeStack.push(fieldTypeRef)
				break
			}

			case Kind.OPERATION_DEFINITION: {
				const operationNode = node as OperationDefinitionNode
				let rootTypeName: string | null = null
				switch (operationNode.operation) {
					case 'query':
						rootTypeName = schema.q
						break
					case 'mutation':
						rootTypeName = schema.m
						break
					case 'subscription':
						rootTypeName = schema.s
						break
				}
				const rootType = rootTypeName ? schema.t[rootTypeName] : undefined
				// TypeRef: [pattern, typeName]
				const typeRef: Maybe<TypeRef> = rootType
					? [TypePattern.T, rootTypeName!]
					: undefined
				this._typeStack.push(typeRef)
				break
			}

			case Kind.INLINE_FRAGMENT:
			case Kind.FRAGMENT_DEFINITION: {
				const fragmentNode = node as InlineFragmentNode | FragmentDefinitionNode
				const typeConditionAST = fragmentNode.typeCondition
				let outputTypeRef: Maybe<TypeRef>

				if (typeConditionAST) {
					outputTypeRef = typeFromAST(typeConditionAST)
				} else {
					// Use current type if no type condition
					outputTypeRef = this.getType()
				}
				this._typeStack.push(outputTypeRef)
				break
			}

			case Kind.VARIABLE_DEFINITION: {
				const varDefNode = node as VariableDefinitionNode
				const inputTypeRef = typeFromAST(varDefNode.type)
				this._inputTypeStack.push(inputTypeRef)
				break
			}

			case Kind.ARGUMENT: {
				const argNode = node as ArgumentNode
				let argDef: Maybe<Argument>
				let argTypeRef: Maybe<TypeRef>

				const directive = this.getDirective()
				const fieldDef = this.getFieldDef()

				if (directive) {
					// Directive: [args, locations, isRepeatable?, description?]
					const args = D.args(directive)
					argDef = args?.[argNode.name.value]
				} else if (fieldDef) {
					// Field: [typeRef, args, description?, deprecationReason?]
					const args = fieldDef[1]
					argDef = args?.[argNode.name.value]
				}

				if (argDef) {
					// Argument: [typeRef, defaultValue?, description?]
					argTypeRef = A.type(argDef)
				}
				this._argument = argDef
				this._defaultValueStack.push(argDef ? A.defaultValue(argDef) : undefined)
				this._inputTypeStack.push(argTypeRef)
				break
			}

			case Kind.LIST: {
				const listTypeRef = this._getNullableType(this.getInputType())
				let itemTypeRef: Maybe<TypeRef>

				if (listTypeRef && isListType(listTypeRef[0])) {
					// Get inner type pattern
					const innerPattern = getListItemType(listTypeRef[0])
					itemTypeRef = [innerPattern, listTypeRef[1]]
				}
				// List is semantically correct if item type is undefined
				this._defaultValueStack.push(undefined)
				this._inputTypeStack.push(itemTypeRef)
				break
			}

			case Kind.OBJECT_FIELD: {
				const objectFieldNode = node as ObjectFieldNode
				const objectTypeName = this._getNamedTypeFromTypeRef(this.getInputType())
				const objectType = objectTypeName ? schema.t[objectTypeName] : undefined
				let inputFieldDef: Maybe<InputField>
				let inputFieldTypeRef: Maybe<TypeRef>

				if (objectType && isInputObjectType(objectType)) {
					// InputObjectType: [kind, fields, isOneOf?, description?]
					const fields = (objectType as InputObjectType)[1]
					inputFieldDef = fields[objectFieldNode.name.value]
					if (inputFieldDef) {
						// InputField: [typeRef, defaultValue?, description?]
						inputFieldTypeRef = IF.type(inputFieldDef)
					}
				}
				this._defaultValueStack.push(inputFieldDef ? IF.defaultValue(inputFieldDef) : undefined)
				this._inputTypeStack.push(inputFieldTypeRef)
				break
			}

			case Kind.ENUM: {
				const enumNode = node as EnumValueNode
				const enumTypeName = this._getNamedTypeFromTypeRef(this.getInputType())
				const enumType = enumTypeName ? schema.t[enumTypeName] : undefined
				let enumValue: Maybe<EnumValue>

				if (enumType && isEnumType(enumType)) {
					// EnumType: [kind, values, description?]
					const values = (enumType as EnumType)[1]
					enumValue = values[enumNode.value]
				}
				this._enumValue = enumValue
				break
			}

			case Kind.DIRECTIVE: {
				const directiveNode = node as DirectiveNode
				const directiveName = directiveNode.name.value
				// Check schema directives first, then fall back to built-in directives
				const directive = schema.d?.[directiveName] ?? BUILT_IN_DIRECTIVES[directiveName]
				this._directive = directive ?? null
				break
			}
		}
	}

	leave(node: ASTNode): void {
		switch (node.kind) {
			case Kind.SELECTION_SET:
				this._parentTypeStack.pop()
				this._parentTypeNameStack.pop()
				break

			case Kind.FIELD:
				this._fieldDefStack.pop()
				this._typeStack.pop()
				break

			case Kind.OPERATION_DEFINITION:
			case Kind.INLINE_FRAGMENT:
			case Kind.FRAGMENT_DEFINITION:
				this._typeStack.pop()
				break

			case Kind.VARIABLE_DEFINITION:
				this._inputTypeStack.pop()
				break

			case Kind.ARGUMENT:
				this._argument = null
				this._defaultValueStack.pop()
				this._inputTypeStack.pop()
				break

			case Kind.LIST:
			case Kind.OBJECT_FIELD:
				this._defaultValueStack.pop()
				this._inputTypeStack.pop()
				break

			case Kind.ENUM:
				this._enumValue = null
				break

			case Kind.DIRECTIVE:
				this._directive = null
				break
		}
	}

	/**
	 * Get field definition from a composite type, including meta-fields
	 */
	private _getFieldDef(parentType: Type, parentTypeName: Maybe<string>, fieldName: string): Maybe<Field> {
		// Handle meta-fields
		if (fieldName === '__typename') {
			// Field: [typeRef, args, description?, deprecationReason?]
			return [[TypePattern.T_NN, 'String'], null]
		}

		// __schema and __type are only on Query type
		if (isObjectType(parentType)) {
			if (parentTypeName === this._schema.q) {
				if (fieldName === '__schema') {
					return [[TypePattern.T_NN, '__Schema'], null]
				}
				if (fieldName === '__type') {
					return [
						[TypePattern.T, '__Type'],
						{ name: [[TypePattern.T_NN, 'String']] },
					]
				}
			}
		}

		// Regular field lookup
		if (isObjectType(parentType) || isInterfaceType(parentType)) {
			// ObjectType: [kind, fields, interfaces, description?]
			// InterfaceType: [kind, fields, interfaces, possibleTypes, description?]
			const fields = (parentType as ObjectType | InterfaceType)[1]
			return fields[fieldName]
		}

		return undefined
	}

	/**
	 * Get the named type name from a type reference
	 */
	private _getNamedTypeFromTypeRef(typeRef: Maybe<TypeRef>): Maybe<string> {
		if (!typeRef) {
			return undefined
		}
		return getTypeName(typeRef)
	}

	/**
	 * Get the nullable type (unwrap NonNull if present)
	 */
	private _getNullableType(typeRef: Maybe<TypeRef>): Maybe<TypeRef> {
		if (!typeRef) {
			return undefined
		}
		if (isNonNullType(typeRef[0])) {
			return [unwrapNonNull(typeRef[0]), typeRef[1]]
		}
		return typeRef
	}
}

/**
 * Creates a visitor wrapper that tracks type information.
 * The wrapped visitor will have type context available via TypeInfo.
 */
export function visitWithTypeInfo(typeInfo: TypeInfo, visitor: ASTVisitor): ASTVisitor {
	return {
		enter(...args) {
			const node = args[0]
			typeInfo.enter(node)

			const fn = getEnterLeaveForKind(visitor, node.kind).enter
			if (fn) {
				const result = fn.apply(visitor, args)
				if (result !== undefined) {
					typeInfo.leave(node)
					if (isNode(result)) {
						typeInfo.enter(result)
					}
				}
				return result
			}
			return undefined
		},
		leave(...args) {
			const node = args[0]
			const fn = getEnterLeaveForKind(visitor, node.kind).leave
			let result: unknown
			if (fn) {
				result = fn.apply(visitor, args)
			}
			typeInfo.leave(node)
			return result
		},
	}
}

/**
 * Get enter/leave functions for a given node kind
 */
function getEnterLeaveForKind(
	visitor: ASTVisitor,
	kind: string,
): { enter?: (...args: unknown[]) => unknown; leave?: (...args: unknown[]) => unknown } {
	const kindVisitor = (visitor as Record<string, unknown>)[kind]

	if (typeof kindVisitor === 'object' && kindVisitor !== null) {
		return kindVisitor as { enter?: (...args: unknown[]) => unknown; leave?: (...args: unknown[]) => unknown }
	} else if (typeof kindVisitor === 'function') {
		return { enter: kindVisitor as (...args: unknown[]) => unknown }
	}

	return {
		enter: (visitor as { enter?: (...args: unknown[]) => unknown }).enter,
		leave: (visitor as { leave?: (...args: unknown[]) => unknown }).leave,
	}
}

/**
 * Check if value is an AST node
 */
function isNode(maybeNode: unknown): maybeNode is ASTNode {
	return typeof maybeNode === 'object' && maybeNode !== null && 'kind' in maybeNode
}
