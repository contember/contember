import type { ElementType, ReactElement, ReactNode } from 'react'
import { assertNever } from './assertNever'
import type { BranchNodeList } from './BranchNodeList'
import { ChildrenAnalyzerError } from './ChildrenAnalyzerError'
import type { ChildrenAnalyzerOptions } from './ChildrenAnalyzerOptions'
import { getErrorMessage } from './helpers'
import type { LeafList } from './LeafList'
import type {
	DeclarationSiteNodeRepresentationFactory,
	RawNodeRepresentation,
	StaticContextFactory,
	SyntheticChildrenFactory,
	UnconstrainedLeafRepresentationFactory,
	ValidFactoryName,
} from './nodeSpecs'
import { wrapError } from './helpers/wrapError'

export class ChildrenAnalyzer<
	AllLeavesRepresentation = any,
	AllBranchNodesRepresentation = never,
	StaticContext = undefined,
> {
	private static defaultOptions: ChildrenAnalyzerOptions = {
		ignoreRenderProps: true,
		renderPropsErrorMessage: 'Render props (functions as React component children) are not supported.',

		ignoreUnhandledNodes: true,
		unhandledNodeErrorMessage: 'Encountered an unknown child.',

		staticContextFactoryName: 'getStaticContext',
		staticRenderFactoryName: 'staticRender',
	}

	private readonly leaves: LeafList<AllLeavesRepresentation, StaticContext>
	private readonly branchNodes: BranchNodeList<AllLeavesRepresentation, AllBranchNodesRepresentation, StaticContext>
	private readonly options: ChildrenAnalyzerOptions<StaticContext>

	public constructor(
		leaves: LeafList<AllLeavesRepresentation, StaticContext>,
		options?: Partial<ChildrenAnalyzerOptions>,
	)
	public constructor(
		leaves: LeafList<AllLeavesRepresentation, StaticContext>,
		branchNodes: BranchNodeList<AllLeavesRepresentation, AllBranchNodesRepresentation, StaticContext>,
		options?: Partial<ChildrenAnalyzerOptions>,
	)
	public constructor(
		leaves: LeafList<AllLeavesRepresentation, StaticContext>,
		decider:
			| Partial<ChildrenAnalyzerOptions>
			| BranchNodeList<AllLeavesRepresentation, AllBranchNodesRepresentation, StaticContext> = [],
		options: Partial<ChildrenAnalyzerOptions> = {},
	) {
		this.leaves = leaves

		if (Array.isArray(decider)) {
			this.branchNodes = decider
		} else {
			this.branchNodes = []
			options = decider
		}
		this.options = { ...ChildrenAnalyzer.defaultOptions, ...options }
	}

	public processChildren(
		children: ReactNode,
		initialStaticContext: StaticContext,
	): Array<AllLeavesRepresentation | AllBranchNodesRepresentation> {
		const processed = this.processNode(children, initialStaticContext, [])

		const rawResult: Array<AllLeavesRepresentation | AllBranchNodesRepresentation | undefined> = Array.isArray(
			processed,
		)
			? processed
			: [processed]

		return rawResult.filter(
			(item): item is AllLeavesRepresentation | AllBranchNodesRepresentation => item !== undefined,
		)
	}

	private processNode(
		node: ReactNode | Function,
		staticContext: StaticContext,
		componentPath: ReactElement[],
	): RawNodeRepresentation<AllLeavesRepresentation, AllBranchNodesRepresentation> {
		if (!node || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
			for (const leaf of this.leaves) {
				const specification = leaf.specification
				if (specification.type === 'useSite') {
					const { ComponentType, factory } = specification
					if (ComponentType === undefined) {
						return factory(node, staticContext)
					}
				}
			}
			if (node === false || node === undefined || node === null) {
				// This adds seamless support for conditionals and such.
				return undefined
			}
			if (!this.options.ignoreUnhandledNodes) {
				throw new ChildrenAnalyzerError(getErrorMessage(this.options.unhandledNodeErrorMessage, node, staticContext))
			}
			return undefined
		}

		if (typeof node === 'function') {
			if (this.options.ignoreRenderProps) {
				return undefined
			}
			throw new ChildrenAnalyzerError(getErrorMessage(this.options.renderPropsErrorMessage, node, staticContext))
		}

		if (Array.isArray(node)) {
			let mapped: Array<AllLeavesRepresentation | AllBranchNodesRepresentation> = []

			for (const subNode of node) {
				const processed = this.processNode(subNode, staticContext, componentPath)

				if (processed !== undefined) {
					if (Array.isArray(processed)) {
						mapped = mapped.concat(processed)
					} else {
						mapped.push(processed)
					}
				}
			}

			return mapped
		}

		let children: ReactNode = undefined

		if (!('type' in node)) {
			return this.processNode(children, staticContext, componentPath)
		}
		children = node.props.children

		if (typeof node.type === 'symbol') {
			// Fragment, Portal or other non-component
			return this.processNode(children, staticContext, componentPath)
		}
		// if (typeof node.type === 'string') {
		// 	// Typically a host component
		// 	if (!this.options.ignoreUnhandledNodes) {
		// 		throw new ChildrenAnalyzerError(getErrorMessage(this.options.unhandledNodeErrorMessage, node, staticContext))
		// 	}
		// 	return this.processNode(children, staticContext)
		// }

		// Component, PureComponent, FunctionComponent

		const treeNode = node.type as ElementType &
			{
				[staticMethod in ValidFactoryName]:
					| StaticContextFactory<any, StaticContext>
					| SyntheticChildrenFactory<any, StaticContext>
					| UnconstrainedLeafRepresentationFactory<any, AllLeavesRepresentation, StaticContext>
					| DeclarationSiteNodeRepresentationFactory<any, unknown, AllBranchNodesRepresentation, StaticContext>
			}

		componentPath = [...componentPath, node]
		if (typeof treeNode !== 'string') {
			if (this.options.staticContextFactoryName in treeNode) {
				const staticContextFactory = treeNode[this.options.staticContextFactoryName] as StaticContextFactory<
					any,
					StaticContext
				>
				try {
					staticContext = staticContextFactory(node.props, staticContext)
				} catch (e) {
					wrapError(e, treeNode.displayName ?? '???', this.options.staticContextFactoryName, componentPath)
				}
			}

			if (this.options.staticRenderFactoryName in treeNode) {
				const factory = treeNode[this.options.staticRenderFactoryName] as SyntheticChildrenFactory<any, StaticContext>
				try {
					children = factory(node.props, staticContext)
				} catch (e) {
					wrapError(e, treeNode.displayName ?? '???', this.options.staticRenderFactoryName, componentPath)
				}
			}
		}

		for (const leaf of this.leaves) {
			const specification = leaf.specification
			switch (specification.type) {
				case 'declarationSite': {
					const { factoryMethodName } = specification

					if (typeof treeNode !== 'string' && factoryMethodName in treeNode) {
						const factory = treeNode[factoryMethodName] as UnconstrainedLeafRepresentationFactory<
							any,
							AllBranchNodesRepresentation | AllLeavesRepresentation,
							StaticContext
						>
						return factory(node.props, staticContext)
					}
					break
				}
				case 'useSite': {
					const { ComponentType, factory } = specification
					if (ComponentType === undefined || node.type === ComponentType) {
						return factory(node, staticContext)
					}
					break
				}
				default:
					return assertNever(specification)
			}
		}

		const processedChildren = this.processNode(children, staticContext, componentPath)

		for (const branchNode of this.branchNodes) {
			const specification = branchNode.specification
			switch (specification.type) {
				case 'declarationSite': {
					const { factoryMethodName, childrenRepresentationReducer } = specification

					if (typeof treeNode !== 'string' && factoryMethodName in treeNode) {
						if (processedChildren === undefined && !branchNode.options.childrenAreOptional) {
							throw new ChildrenAnalyzerError(branchNode.options.childrenAbsentErrorMessage)
						}
						const factory = treeNode[factoryMethodName] as DeclarationSiteNodeRepresentationFactory<
							any,
							unknown,
							AllBranchNodesRepresentation | AllLeavesRepresentation,
							StaticContext
						>
						return factory(node.props, childrenRepresentationReducer(processedChildren), staticContext)
					}
					break
				}
				case 'useSite': {
					const { factory, ComponentType } = specification
					if (ComponentType === undefined || node.type === ComponentType) {
						if (processedChildren === undefined && !branchNode.options.childrenAreOptional) {
							throw new ChildrenAnalyzerError(branchNode.options.childrenAbsentErrorMessage)
						}
						return factory(node, processedChildren, staticContext)
					}
					break
				}
				default:
					return assertNever(specification)
			}
		}

		if (
			!this.options.ignoreUnhandledNodes &&
			!(typeof treeNode !== 'string' && this.options.staticRenderFactoryName in treeNode)
		) {
			throw new ChildrenAnalyzerError(getErrorMessage(this.options.unhandledNodeErrorMessage, node, staticContext))
		}

		return processedChildren
	}
}
