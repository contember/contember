import { Validation, Value } from '@contember/schema'
import { assertNever } from '../utils'

namespace ValidationContext {
	export type AnyContext = NodeContext | ValueContext | NodeListContext | UndefinedNodeContext

	interface ValidationContext<Type extends NodeContextType> {
		root: NodeContext
		type: Type
	}

	export type NodeType = Value.Object
	export type ValueType = Value.FieldValue | undefined

	export enum NodeContextType {
		value = 'value',
		node = 'node',
		nodeList = 'nodeList',
		undefined = 'undefined',
	}

	export interface ContextWithNode {
		node: NodeType
	}

	export interface NodeContext extends ValidationContext<NodeContextType.node>, ContextWithNode {}

	export interface UndefinedNodeContext extends ValidationContext<NodeContextType.undefined> {}

	export interface ValueContext extends ValidationContext<NodeContextType.value>, ContextWithNode {
		value: ValueType
	}

	export interface NodeListContext extends ValidationContext<NodeContextType.nodeList> {
		nodes: (NodeContext | ValueContext)[]
	}

	export const ensureNodeListContext = (context: AnyContext): NodeListContext => {
		return context.type === NodeContextType.nodeList
			? context
			: createNodeListContext(context.root, context.type === NodeContextType.undefined ? [] : [context])
	}

	export const createNodeContext = (root: NodeContext, node: NodeType): NodeContext => ({
		root,
		node,
		type: NodeContextType.node,
	})
	export const createUndefinedNodeContext = (root: NodeContext): UndefinedNodeContext => ({
		root,
		type: NodeContextType.undefined,
	})
	export const createValueContext = (root: NodeContext, node: NodeType, value: ValueType): ValueContext => ({
		root,
		node,
		value,
		type: NodeContextType.value,
	})
	export const createNodeListContext = (root: NodeContext, nodes: (NodeContext | ValueContext)[]): NodeListContext => ({
		root,
		nodes,
		type: NodeContextType.nodeList,
	})
	export const createRootContext = (node: NodeType): NodeContext => {
		const context: any = { node }
		context.root = context
		return context
	}

	export const createSingleNodeContext = (
		parent: NodeContext | ValueContext,
		value: ValueType,
	): NodeContext | ValueContext => {
		if (Array.isArray(value)) {
			throw new Error('Nested arrays are not allowed')
		}
		if (typeof value === 'object' && value !== null) {
			return createNodeContext(parent.root, value as NodeType)
		}
		return createValueContext(parent.root, parent.node, value)
	}

	export const createContext = (context: AnyContext, part: string): AnyContext => {
		if (context.type === NodeContextType.nodeList) {
			const emptyContext: NodeListContext = {
				root: context.root,
				nodes: [],
				type: NodeContextType.nodeList,
			}
			return context.nodes
				.map(it => createContext(it, part))
				.map(it => ensureNodeListContext(it))
				.reduce<NodeListContext>(
					(acc, context) => createNodeListContext(acc.root, [...acc.nodes, ...context.nodes]),
					emptyContext,
				)
		}
		if (context.type === NodeContextType.undefined) {
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

	export interface ContextVisitor<R> {
		visitNodeListContext(context: NodeListContext): R
		visitNodeContext(context: NodeContext): R
		visitValueContext(context: ValueContext): R
		visitUndefinedContext(context: UndefinedNodeContext): R
	}

	export const acceptContextVisitor = <R>(context: AnyContext, visitor: ContextVisitor<R>): R => {
		switch (context.type) {
			case ValidationContext.NodeContextType.node:
				return visitor.visitNodeContext(context)
			case ValidationContext.NodeContextType.nodeList:
				return visitor.visitNodeListContext(context)
			case ValidationContext.NodeContextType.value:
				return visitor.visitValueContext(context)
			case ValidationContext.NodeContextType.undefined:
				return visitor.visitUndefinedContext(context)
			default:
				assertNever(context)
		}
	}
}

export { ValidationContext }
