import type { ReactNode } from 'react'
import { BindingError } from '../BindingError'
import type { Filter } from '../treeParameters'
import equal from 'fast-deep-equal/es6'
import { Schema, SchemaColumn, SchemaEntity, SchemaRelation } from '../core/schema'

class Environment {
	private constructor(
		private readonly options: Environment.Options,
	) {
	}

	public static create() {
		return new Environment({
			dimensions: {},
			variables: {},
			parameters: {},
			extensions: new Map(),
		})
	}

	public getSubTree(): Environment.SubTreeNode {
		for (let env: Environment = this; env.options.node; env = env.getParent()) {
			const node = env.options.node
			if (node.type === 'subtree-entity' || node.type === 'subtree-entity-list') {
				return node
			}
		}
		throw new BindingError('Not in a SubTree')
	}

	public getSubTreeNode(): Environment.AnyNode {
		if (!this.options.node) {
			throw new BindingError()
		}
		return this.options.node
	}

	public withSubTree(SubTree: Environment.SubTreeNode) {
		const { parent, ...options } = this.options
		return new Environment({
			...options,
			node: SubTree,
		})
	}

	public withSubTreeChild(node: Environment.InnerNode) {
		if (!this.options.node) {
			throw new BindingError(`Cannot call withSubTreeChild without previous call of withSubTree`)
		}
		if (this.options.node.entity.fields.get(node.field.name) !== node.field) {
			throw new BindingError()
		}
		return new Environment({
			...this.options,
			node,
			parent: this,
		})
	}


	public hasVariable(key: string): boolean {
		return key in this.options.variables
	}

	public getVariable<V extends Environment.Value = Environment.Value>(key: string): V {
		if (!(key in this.options.variables)) {
			throw new BindingError(`Variable ${key} not found`)
		}
		return this.options.variables[key] as V
	}

	public getVariableOrElse<F, V extends Environment.Value = Environment.Value>(key: string, fallback: F): V | F {
		return (this.options.variables[key] as V) ?? fallback
	}

	/** @deprecated use getVariable or getParameter */
	public getValue<V extends Environment.Value = Environment.Value>(key: string): V {
		console.warn('Environment.getValue() is deprecated, use Environment.getVariable() or Environment.getParameter() instead.')
		return this.getVariableOrElse(key, undefined) ?? this.getParameterOrElse(key, undefined) as V
	}

	/** @deprecated use getVariableOrElse or getParameterOrElse */
	public getValueOrElse<F, V extends Environment.Value = Environment.Value>(key: string, fallback: F): V | F {
		console.warn('Environment.getValueOrElse() is deprecated, use Environment.getVariableOrElse() or Environment.getParameterOrElse() instead.')
		return this.getVariableOrElse(key, undefined) ?? this.getParameterOrElse(key, fallback) as V | F
	}

	/** @deprecated */
	public hasName(key: string): boolean {
		console.warn('Environment.hasName() is deprecated, use Environment.hasVariable() or Environment.hasParameter() instead.')
		return key in this.options.variables || key in this.options.parameters
	}

	public withVariables(variables: Environment.ValuesMapWithFactory | undefined): Environment {
		if (variables === undefined) {
			return this
		}
		const newVariables = { ...this.options.variables }
		for (const [newName, newValue] of Object.entries(variables)) {
			if (newName === 'labelMiddleware') {
				throw new BindingError('You cannot pass labelMiddleware to withVariables method. Use withLabelMiddleware instead.')
			}
			const resolvedValue = typeof newValue === 'function' ? newValue(this) : newValue
			if (resolvedValue === undefined) {
				delete newVariables[newName]
			} else {
				newVariables[newName] = resolvedValue
			}
		}
		return new Environment({
			...this.options,
			variables: newVariables,
			parent: this,
		})
	}

	public getAllVariables() {
		return this.options.variables
	}

	public hasParameter(key: string): boolean {
		return key in this.options.parameters
	}

	public getParameter<F>(key: string): string | number {
		if (!(key in this.options.parameters)) {
			throw new BindingError(`Parameter ${key} not found`)
		}
		return this.options.parameters[key] as string | number
	}

	public getParameterOrElse<F>(key: string, fallback: F): string | number | F {
		return this.options.parameters[key] ?? fallback
	}

	public getAllParameters() {
		return this.options.parameters
	}

	public withParameters(parameters: Environment.Parameters): Environment {
		return new Environment({ ...this.options, parameters })
	}

	public hasDimension(dimensionName: string): boolean {
		return dimensionName in this.options.dimensions
	}

	public getDimension<F>(dimensionName: string): string[] {
		if (!(dimensionName in this.options.dimensions)) {
			throw new BindingError(`Dimension ${dimensionName} does not exist.`)
		}
		return this.options.dimensions[dimensionName]
	}

	public getDimensionOrElse<F>(dimensionName: string, fallback: F): string[] | F {
		return this.options.dimensions[dimensionName] ?? fallback
	}

	public getAllDimensions(): Environment.SelectedDimensions {
		return this.options.dimensions
	}

	public withDimensions(dimensions: Environment.SelectedDimensions): Environment {
		const newDimensions = {
			...this.options.dimensions,
			...dimensions,
		}
		if (equal(newDimensions, this.options.dimensions)) {
			return this
		}
		return new Environment({ ...this.options, dimensions: newDimensions })
	}

	public getSchema(): Schema {
		if (!this.options.schema) {
			throw new BindingError('Schema is not set')
		}
		return this.options.schema
	}

	public withSchema(schema: Schema): Environment {
		return new Environment({ ...this.options, schema })
	}

	public getParent(): Environment {
		if (!this.options.parent) {
			throw new BindingError('There is no parent environment')
		}
		return this.options.parent
	}

	public withExtension<S, R>(extension: Environment.ExtensionFactory<S, R>, state: S): Environment {
		return new Environment({
			...this.options,
			extensions: new Map([...this.options.extensions, [extension, state]]),
		})
	}

	public getExtension<S, R>(extension: Environment.ExtensionFactory<S, R>): R {
		const state = this.options.extensions.get(extension)
		return extension(state, this)
	}

	public merge(other: Environment): Environment {
		if (other === this) {
			return this
		}
		if (!equal(this.options.node, other.options.node)) {
			throw new BindingError(`Cannot merge two environments with different tree position.`)
		}
		if (this.options.parameters !== other.options.parameters) {
			throw new BindingError(`Cannot merge two environments with different parameters.`)
		}
		if (this.options.dimensions !== other.options.dimensions) {
			throw new BindingError(`Cannot merge two environments with different dimensions.`)
		}
		if (equal(this.options.variables, other.options.variables) && this.options.parent === other.options.parent) {
			return this
		}
		for (const key in other.options.variables) {
			if (key in this.options.variables && !equal(this.options.variables[key], other.options.variables[key])) {
				throw new BindingError(`Cannot merge two environments with different value of variable ${key}:\n`
					+ JSON.stringify(this.options.variables[key]) + '\n'
					+ JSON.stringify(other.options.variables[key]))
			}
		}

		return new Environment({
			...this.options,
			parent: this.options.parent && other.options.parent ? this.options.parent.merge(other.options.parent) : undefined,
			variables: { ...this.options.variables, ...other.options.variables },
		})
	}
}

namespace Environment {
	export type Name = string

	export type Value = ReactNode

	export type ResolvedValue = Value | Filter

	export interface Options {
		node?: AnyNode
		schema?: Schema
		dimensions: SelectedDimensions
		parameters: Parameters
		variables: CustomVariables
		parent?: Environment
		extensions: Map<ExtensionFactory<any, any>, any>
	}

	export type SubTreeNode =
		| SubTreeEntityNode
		| SubTreeEntityListNode

	export type InnerNode =
		| EntityNode
		| EntityListNode
		| ColumnNode

	export type AnyNode =
		| SubTreeNode
		| InnerNode

	export interface SubTreeEntityNode {
		type: 'subtree-entity'
		entity: SchemaEntity
		expectedCardinality: 'zero' | 'one' | 'zero-or-one'
		filter: Filter
	}

	export interface SubTreeEntityListNode {
		type: 'subtree-entity-list'
		entity: SchemaEntity
		expectedCardinality: 'zero-to-many' | 'zero'
		filter: Filter
	}

	export interface EntityNode {
		type: 'entity'
		entity: SchemaEntity
		field: SchemaRelation
	}

	export interface EntityListNode {
		type: 'entity-list'
		entity: SchemaEntity
		field: SchemaRelation
	}

	export interface ColumnNode {
		type: 'column'
		entity: SchemaEntity
		field: SchemaColumn
	}

	export interface SelectedDimensions {
		[key: string]: string[]
	}

	export type Parameters = {
		[K in string]?: string | number
	}

	export interface CustomVariables {
		[key: string]: Value
	}

	export interface ValuesMapWithFactory {
		[key: string]:
			| ((environment: Environment) => Value)
			| Value
	}

	export type ExtensionFactory<State, Result> = (state: State | undefined, environment: Environment) => Result

	/** @deprecated */
	export type DeltaFactory = ValuesMapWithFactory
}

export { Environment }
