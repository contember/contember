/**
 * ValidationContext - provides context for validation rules
 * Adapted from graphql-js for compact Schema
 */
import type {
	ASTVisitor,
	DocumentNode,
	FragmentDefinitionNode,
	FragmentSpreadNode,
	OperationDefinitionNode,
	SelectionSetNode,
	VariableNode,
} from 'graphql'
import { GraphQLError, Kind, visit } from 'graphql'

import type { Argument, Directive, EnumValue, Field, Schema, Type, TypeRef } from '../types/schema.js'
import type { ScalarMap } from '../types/resolvers.js'
import { TypeInfo, visitWithTypeInfo } from './TypeInfo.js'

type Maybe<T> = T | null | undefined

interface VariableUsage {
	readonly node: VariableNode
	readonly type: Maybe<TypeRef>
	readonly defaultValue: Maybe<unknown>
}

type NodeWithSelectionSet = OperationDefinitionNode | FragmentDefinitionNode

/**
 * ValidationContext provides the context needed for validation rules.
 * It includes the schema, document, type info, and helper methods.
 */
export class ValidationContext {
	private readonly _schema: Schema
	private readonly _document: DocumentNode
	private readonly _typeInfo: TypeInfo
	private readonly _scalars: ScalarMap
	private readonly _onError: (error: GraphQLError) => void

	// Lazy caches
	private _fragments: Map<string, FragmentDefinitionNode> | undefined
	private _fragmentSpreads: Map<SelectionSetNode, ReadonlyArray<FragmentSpreadNode>>
	private _recursivelyReferencedFragments: Map<
		OperationDefinitionNode,
		ReadonlyArray<FragmentDefinitionNode>
	>
	private _variableUsages: Map<NodeWithSelectionSet, ReadonlyArray<VariableUsage>>
	private _recursiveVariableUsages: Map<OperationDefinitionNode, ReadonlyArray<VariableUsage>>

	constructor(
		schema: Schema,
		document: DocumentNode,
		typeInfo: TypeInfo,
		scalars: ScalarMap,
		onError: (error: GraphQLError) => void,
	) {
		this._schema = schema
		this._document = document
		this._typeInfo = typeInfo
		this._scalars = scalars
		this._onError = onError

		this._fragmentSpreads = new Map()
		this._recursivelyReferencedFragments = new Map()
		this._variableUsages = new Map()
		this._recursiveVariableUsages = new Map()
	}

	get [Symbol.toStringTag](): string {
		return 'ValidationContext'
	}

	reportError(error: GraphQLError): void {
		this._onError(error)
	}

	getSchema(): Schema {
		return this._schema
	}

	getDocument(): DocumentNode {
		return this._document
	}

	getScalars(): ScalarMap {
		return this._scalars
	}

	// Fragment helpers

	getFragment(name: string): Maybe<FragmentDefinitionNode> {
		let fragments = this._fragments
		if (!fragments) {
			fragments = new Map()
			for (const definition of this._document.definitions) {
				if (definition.kind === Kind.FRAGMENT_DEFINITION) {
					fragments.set(definition.name.value, definition)
				}
			}
			this._fragments = fragments
		}
		return fragments.get(name)
	}

	getFragmentSpreads(selectionSet: SelectionSetNode): ReadonlyArray<FragmentSpreadNode> {
		let spreads = this._fragmentSpreads.get(selectionSet)
		if (!spreads) {
			spreads = []
			const setsToVisit: SelectionSetNode[] = [selectionSet]
			let set: SelectionSetNode | undefined
			while ((set = setsToVisit.pop())) {
				for (const selection of set.selections) {
					if (selection.kind === Kind.FRAGMENT_SPREAD) {
						;(spreads as FragmentSpreadNode[]).push(selection)
					} else if (selection.selectionSet) {
						setsToVisit.push(selection.selectionSet)
					}
				}
			}
			this._fragmentSpreads.set(selectionSet, spreads)
		}
		return spreads
	}

	getRecursivelyReferencedFragments(
		operation: OperationDefinitionNode,
	): ReadonlyArray<FragmentDefinitionNode> {
		let fragments = this._recursivelyReferencedFragments.get(operation)
		if (!fragments) {
			fragments = []
			const collectedNames = new Set<string>()
			const nodesToVisit: SelectionSetNode[] = [operation.selectionSet]
			let node: SelectionSetNode | undefined
			while ((node = nodesToVisit.pop())) {
				for (const spread of this.getFragmentSpreads(node)) {
					const fragName = spread.name.value
					if (!collectedNames.has(fragName)) {
						collectedNames.add(fragName)
						const fragment = this.getFragment(fragName)
						if (fragment) {
							;(fragments as FragmentDefinitionNode[]).push(fragment)
							nodesToVisit.push(fragment.selectionSet)
						}
					}
				}
			}
			this._recursivelyReferencedFragments.set(operation, fragments)
		}
		return fragments
	}

	// Variable usage tracking

	getVariableUsages(node: NodeWithSelectionSet): ReadonlyArray<VariableUsage> {
		let usages = this._variableUsages.get(node)
		if (!usages) {
			const newUsages: VariableUsage[] = []
			const typeInfo = new TypeInfo(this._schema)
			visit(
				node,
				visitWithTypeInfo(typeInfo, {
					VariableDefinition: () => false,
					Variable(variable) {
						newUsages.push({
							node: variable,
							type: typeInfo.getInputType(),
							defaultValue: typeInfo.getDefaultValue(),
						})
					},
				}),
			)
			usages = newUsages
			this._variableUsages.set(node, usages)
		}
		return usages
	}

	getRecursiveVariableUsages(
		operation: OperationDefinitionNode,
	): ReadonlyArray<VariableUsage> {
		let usages = this._recursiveVariableUsages.get(operation)
		if (!usages) {
			usages = this.getVariableUsages(operation)
			for (const fragment of this.getRecursivelyReferencedFragments(operation)) {
				usages = usages.concat(this.getVariableUsages(fragment))
			}
			this._recursiveVariableUsages.set(operation, usages)
		}
		return usages
	}

	// TypeInfo delegates

	getType(): Maybe<TypeRef> {
		return this._typeInfo.getType()
	}

	getParentType(): Maybe<Type> {
		return this._typeInfo.getParentType()
	}

	getParentTypeName(): Maybe<string> {
		return this._typeInfo.getParentTypeName()
	}

	getInputType(): Maybe<TypeRef> {
		return this._typeInfo.getInputType()
	}

	getParentInputType(): Maybe<TypeRef> {
		return this._typeInfo.getParentInputType()
	}

	getFieldDef(): Maybe<Field> {
		return this._typeInfo.getFieldDef()
	}

	getDirective(): Maybe<Directive> {
		return this._typeInfo.getDirective()
	}

	getArgument(): Maybe<Argument> {
		return this._typeInfo.getArgument()
	}

	getEnumValue(): Maybe<EnumValue> {
		return this._typeInfo.getEnumValue()
	}
}

/**
 * A validation rule is a function that returns an AST visitor
 */
export type ValidationRule = (context: ValidationContext) => ASTVisitor
