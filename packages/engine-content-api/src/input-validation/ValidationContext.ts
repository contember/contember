import { Validation, Value } from '@contember/schema'

namespace ValidationContext {
	export type AnyContext = NodeContext | ValueContext | NodeListContext | UndefinedNodeContext

	interface ValidationContext {
		root: NodeContext
	}

	export type NodeType = Value.Object
	export type ValueType = Value.FieldValue

	export interface NodeContext extends ValidationContext {
		node: NodeType
	}

	interface UndefinedNodeContext extends ValidationContext {
		node: undefined
	}

	interface ValueContext extends NodeContext {
		value: ValueType
	}

	interface NodeListContext extends ValidationContext {
		nodes: NodeContext[]
	}

	export const ensureNodeListContext = (context: AnyContext): NodeListContext => {
		return isNodeListContext(context)
			? context
			: createNodeListContext(context.root, isUndefinedNodeContext(context) ? [] : [context])
	}

	export const isNodeContext = (context: AnyContext): context is NodeContext =>
		'node' in context && context.node !== undefined
	export const isUndefinedNodeContext = (context: AnyContext): context is UndefinedNodeContext =>
		'node' in context && context.node === undefined
	export const isValueContext = (context: AnyContext): context is ValueContext =>
		isNodeContext(context) && 'value' in context
	export const isNodeListContext = (context: AnyContext): context is NodeListContext => 'nodes' in context

	export const createNodeContext = (root: NodeContext, node: NodeType): NodeContext => ({ root, node })
	export const createUndefinedNodeContext = (root: NodeContext): UndefinedNodeContext => ({ root, node: undefined })
	export const createValueContext = (root: NodeContext, node: NodeType, value: ValueType): ValueContext => ({
		root,
		node,
		value,
	})
	export const createNodeListContext = (root: NodeContext, nodes: NodeContext[]) => ({ root, nodes })
	export const createRootContext = (node: NodeType): NodeContext => {
		const context: any = { node }
		context.root = context
		return context
	}

	export const createSingleNodeContext = (
		parent: NodeContext,
		value: object | null | string | number | boolean,
	): NodeContext => {
		if (Array.isArray(value)) {
			throw new Error('Nested arrays are not allowed')
		}
		if (typeof value === 'object' && value !== null) {
			return createNodeContext(parent.root, value as NodeType)
		}
		return createValueContext(parent.root, parent.node, value)
	}

	export const createContext = (context: AnyContext, part: string): AnyContext => {
		if (isNodeListContext(context)) {
			const emptyContext = {
				root: context.root,
				nodes: [],
			}
			return context.nodes
				.map(it => createContext(it, part))
				.map(it => ensureNodeListContext(it))
				.reduce<NodeListContext>(
					(acc, context) => createNodeListContext(acc.root, [...acc.nodes, ...context.nodes]),
					emptyContext,
				)
		}
		if (context.node === undefined) {
			return context
		}
		if (typeof context.node[part] === 'undefined') {
			return createUndefinedNodeContext(context.root)
		}
		const value = context.node[part]
		if (Array.isArray(value)) {
			return createNodeListContext(
				context.root,
				value.map(it => createSingleNodeContext(context, it)),
			)
		}
		return createSingleNodeContext(context, value)
	}

	export const changeContext = (context: AnyContext, path: Validation.ContextPath): AnyContext => {
		return path.reduce<AnyContext>((result, part) => {
			return createContext(result, part)
		}, context)
	}
}

export default ValidationContext
