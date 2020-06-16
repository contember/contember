import * as React from 'react'
import { assertNever } from './assertNever'
import { BranchNodeList } from './BranchNodeList'
import { ChildrenAnalyzerError } from './ChildrenAnalyzerError'
import { ChildrenAnalyzerOptions } from './ChildrenAnalyzerOptions'
import { getErrorMessage } from './helpers'
import { LeafList } from './LeafList'
import {
	DeclarationSiteNodeRepresentationFactory,
	LeafRepresentationFactory,
	RawNodeRepresentation,
	RepresentationFactorySite,
	ValidFactoryName,
} from './nodeSpecs'
import { BaseComponent, EnvironmentFactory, SyntheticChildrenFactory } from './nodeSpecs/types'

export class ChildrenAnalyzer<
	AllLeafsRepresentation = any,
	AllBranchNodesRepresentation = never,
	Environment = undefined
> {
	private static defaultOptions: ChildrenAnalyzerOptions = {
		ignoreRenderProps: true,
		renderPropsErrorMessage: 'Render props (functions as React component children) are not supported.',

		ignoreUnhandledNodes: true,
		unhandledNodeErrorMessage: 'Encountered an unknown child.',

		environmentFactoryName: 'generateEnvironment',
		syntheticChildrenFactoryName: 'generateSyntheticChildren',
	}

	private readonly leafs: LeafList<AllLeafsRepresentation, Environment>
	private readonly branchNodes: BranchNodeList<AllLeafsRepresentation, AllBranchNodesRepresentation, Environment>
	private readonly options: ChildrenAnalyzerOptions<Environment>

	public constructor(leafs: LeafList<AllLeafsRepresentation, Environment>, options?: Partial<ChildrenAnalyzerOptions>)
	public constructor(
		leafs: LeafList<AllLeafsRepresentation, Environment>,
		branchNodes: BranchNodeList<AllLeafsRepresentation, AllBranchNodesRepresentation, Environment>,
		options?: Partial<ChildrenAnalyzerOptions>,
	)
	public constructor(
		leafs: LeafList<AllLeafsRepresentation, Environment>,
		decider:
			| Partial<ChildrenAnalyzerOptions>
			| BranchNodeList<AllLeafsRepresentation, AllBranchNodesRepresentation, Environment> = [],
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
		initialEnvironment: Environment,
	): Array<AllLeafsRepresentation | AllBranchNodesRepresentation> {
		const processed = this.processNode(children, initialEnvironment)

		const rawResult: Array<AllLeafsRepresentation | AllBranchNodesRepresentation | undefined> = Array.isArray(processed)
			? processed
			: [processed]

		return rawResult.filter((item): item is AllLeafsRepresentation | AllBranchNodesRepresentation => item !== undefined)
	}

	private processNode(
		node: React.ReactNode | Function,
		environment: Environment,
	): RawNodeRepresentation<AllLeafsRepresentation, AllBranchNodesRepresentation> {
		if (!node || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
			return undefined
		}

		if (typeof node === 'function') {
			if (this.options.ignoreRenderProps) {
				return undefined
			}
			throw new ChildrenAnalyzerError(getErrorMessage(this.options.renderPropsErrorMessage, node, environment))
		}

		if (Array.isArray(node)) {
			let mapped: Array<AllLeafsRepresentation | AllBranchNodesRepresentation> = []

			for (const subNode of node) {
				const processed = this.processNode(subNode, environment)

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
				return this.processNode(children, environment)
			}

			// React.Component, React.PureComponent, React.FunctionComponent

			const treeNode = node.type as BaseComponent<any> &
				{
					[staticMethod in ValidFactoryName]:
						| EnvironmentFactory<any, Environment>
						| SyntheticChildrenFactory<any, Environment>
						| LeafRepresentationFactory<any, AllLeafsRepresentation, Environment>
						| DeclarationSiteNodeRepresentationFactory<any, unknown, AllBranchNodesRepresentation, Environment>
				}

			if (this.options.environmentFactoryName in treeNode) {
				const environmentFactory = treeNode[this.options.environmentFactoryName] as EnvironmentFactory<any, Environment>
				environment = environmentFactory(node.props, environment)
			}

			if (this.options.syntheticChildrenFactoryName in treeNode) {
				const factory = treeNode[this.options.syntheticChildrenFactoryName] as SyntheticChildrenFactory<
					any,
					Environment
				>
				children = factory(node.props, environment)
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
								Environment
							>
							return factory(node.props, environment)
						}
						break
					}
					case RepresentationFactorySite.UseSite: {
						const { ComponentType, factory } = specification
						if (ComponentType === undefined || node.type === ComponentType) {
							return factory(node.props, environment)
						}
						break
					}
					default:
						return assertNever(specification)
				}
			}

			const processedChildren = this.processNode(children, environment)

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
								Environment
							>
							return factory(node.props, childrenRepresentationReducer(processedChildren), environment)
						}
						break
					}
					case RepresentationFactorySite.UseSite: {
						const { factory, ComponentType } = specification
						if (ComponentType === undefined || node.type === ComponentType) {
							if (!processedChildren) {
								throw new ChildrenAnalyzerError(branchNode.options.childrenAbsentErrorMessage)
							}
							return factory(node.props, processedChildren, environment)
						}
						break
					}
					default:
						return assertNever(specification)
				}
			}

			if (!this.options.ignoreUnhandledNodes) {
				throw new ChildrenAnalyzerError(getErrorMessage(this.options.unhandledNodeErrorMessage, node, environment))
			}

			return processedChildren
		}
		return this.processNode(children, environment)
	}
}
