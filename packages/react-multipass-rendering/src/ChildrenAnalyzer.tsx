import * as React from 'react'
import { assertNever } from './assertNever'
import { BranchNodeList } from './BranchNodeList'
import { ChildrenAnalyzerError } from './ChildrenAnalyzerError'
import { ChildrenAnalyzerOptions } from './ChildrenAnalyzerOptions'
import { getErrorMessage } from './helpers'
import { LeafList } from './LeafList'
import {
	BaseComponent,
	DeclarationSiteNodeRepresentationFactory,
	LeafRepresentationFactory,
	RawNodeRepresentation,
	RepresentationFactorySite,
	StaticContextFactory,
	SyntheticChildrenFactory,
	ValidFactoryName,
} from './nodeSpecs'

export class ChildrenAnalyzer<
	AllLeafsRepresentation = any,
	AllBranchNodesRepresentation = never,
	StaticContext = undefined
> {
	private static defaultOptions: ChildrenAnalyzerOptions = {
		ignoreRenderProps: true,
		renderPropsErrorMessage: 'Render props (functions as React component children) are not supported.',

		ignoreUnhandledNodes: true,
		unhandledNodeErrorMessage: 'Encountered an unknown child.',

		staticContextFactoryName: 'getStaticContext',
		staticRenderFactoryName: 'staticRender',
	}

	private readonly leafs: LeafList<AllLeafsRepresentation, StaticContext>
	private readonly branchNodes: BranchNodeList<AllLeafsRepresentation, AllBranchNodesRepresentation, StaticContext>
	private readonly options: ChildrenAnalyzerOptions<StaticContext>

	public constructor(leafs: LeafList<AllLeafsRepresentation, StaticContext>, options?: Partial<ChildrenAnalyzerOptions>)
	public constructor(
		leafs: LeafList<AllLeafsRepresentation, StaticContext>,
		branchNodes: BranchNodeList<AllLeafsRepresentation, AllBranchNodesRepresentation, StaticContext>,
		options?: Partial<ChildrenAnalyzerOptions>,
	)
	public constructor(
		leafs: LeafList<AllLeafsRepresentation, StaticContext>,
		decider:
			| Partial<ChildrenAnalyzerOptions>
			| BranchNodeList<AllLeafsRepresentation, AllBranchNodesRepresentation, StaticContext> = [],
		options: Partial<ChildrenAnalyzerOptions> = {},
	) {
		this.leafs = leafs

		if (Array.isArray(decider)) {
			this.branchNodes = decider
		} else {
			this.branchNodes = []
			options = decider
		}
		this.options = { ...ChildrenAnalyzer.defaultOptions, ...options }
	}

	public processChildren(
		children: React.ReactNode,
		initialStaticContext: StaticContext,
	): Array<AllLeafsRepresentation | AllBranchNodesRepresentation> {
		const processed = this.processNode(children, initialStaticContext)

		const rawResult: Array<AllLeafsRepresentation | AllBranchNodesRepresentation | undefined> = Array.isArray(processed)
			? processed
			: [processed]

		return rawResult.filter((item): item is AllLeafsRepresentation | AllBranchNodesRepresentation => item !== undefined)
	}

	private processNode(
		node: React.ReactNode | Function,
		staticContext: StaticContext,
	): RawNodeRepresentation<AllLeafsRepresentation, AllBranchNodesRepresentation> {
		if (!node || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
			return undefined
		}

		if (typeof node === 'function') {
			if (this.options.ignoreRenderProps) {
				return undefined
			}
			throw new ChildrenAnalyzerError(getErrorMessage(this.options.renderPropsErrorMessage, node, staticContext))
		}

		if (Array.isArray(node)) {
			let mapped: Array<AllLeafsRepresentation | AllBranchNodesRepresentation> = []

			for (const subNode of node) {
				const processed = this.processNode(subNode, staticContext)

				if (processed) {
					if (Array.isArray(processed)) {
						mapped = mapped.concat(processed)
					} else {
						mapped.push(processed)
					}
				}
			}

			return mapped
		}

		let children: React.ReactNode = undefined

		if ('type' in node) {
			children = node.props.children

			if (typeof node.type === 'symbol' || typeof node.type === 'string') {
				// React.Fragment, React.Portal or other non-component
				return this.processNode(children, staticContext)
			}

			// React.Component, React.PureComponent, React.FunctionComponent

			const treeNode = node.type as BaseComponent<any> &
				{
					[staticMethod in ValidFactoryName]:
						| StaticContextFactory<any, StaticContext>
						| SyntheticChildrenFactory<any, StaticContext>
						| LeafRepresentationFactory<any, AllLeafsRepresentation, StaticContext>
						| DeclarationSiteNodeRepresentationFactory<any, unknown, AllBranchNodesRepresentation, StaticContext>
				}

			if (this.options.staticContextFactoryName in treeNode) {
				const StaticContextFactory = treeNode[this.options.staticContextFactoryName] as StaticContextFactory<
					any,
					StaticContext
				>
				staticContext = StaticContextFactory(node.props, staticContext)
			}

			if (this.options.staticRenderFactoryName in treeNode) {
				const factory = treeNode[this.options.staticRenderFactoryName] as SyntheticChildrenFactory<any, StaticContext>
				children = factory(node.props, staticContext)
			}

			for (const leaf of this.leafs) {
				const specification = leaf.specification
				switch (specification.type) {
					case RepresentationFactorySite.DeclarationSite: {
						const { factoryMethodName } = specification

						if (factoryMethodName in treeNode) {
							const factory = treeNode[factoryMethodName] as LeafRepresentationFactory<
								any,
								AllBranchNodesRepresentation | AllLeafsRepresentation,
								StaticContext
							>
							return factory(node.props, staticContext)
						}
						break
					}
					case RepresentationFactorySite.UseSite: {
						const { ComponentType, factory } = specification
						if (ComponentType === undefined || node.type === ComponentType) {
							return factory(node.props, staticContext)
						}
						break
					}
					default:
						return assertNever(specification)
				}
			}

			const processedChildren = this.processNode(children, staticContext)

			for (const branchNode of this.branchNodes) {
				const specification = branchNode.specification
				switch (specification.type) {
					case RepresentationFactorySite.DeclarationSite: {
						const { factoryMethodName, childrenRepresentationReducer } = specification

						if (factoryMethodName in treeNode) {
							if (!processedChildren) {
								throw new ChildrenAnalyzerError(branchNode.options.childrenAbsentErrorMessage)
							}
							const factory = treeNode[factoryMethodName] as DeclarationSiteNodeRepresentationFactory<
								any,
								unknown,
								AllBranchNodesRepresentation | AllLeafsRepresentation,
								StaticContext
							>
							return factory(node.props, childrenRepresentationReducer(processedChildren), staticContext)
						}
						break
					}
					case RepresentationFactorySite.UseSite: {
						const { factory, ComponentType } = specification
						if (ComponentType === undefined || node.type === ComponentType) {
							if (!processedChildren) {
								throw new ChildrenAnalyzerError(branchNode.options.childrenAbsentErrorMessage)
							}
							return factory(node.props, processedChildren, staticContext)
						}
						break
					}
					default:
						return assertNever(specification)
				}
			}

			if (!this.options.ignoreUnhandledNodes) {
				throw new ChildrenAnalyzerError(getErrorMessage(this.options.unhandledNodeErrorMessage, node, staticContext))
			}

			return processedChildren
		}
		return this.processNode(children, staticContext)
	}
}
