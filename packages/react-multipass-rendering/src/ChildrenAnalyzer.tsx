import * as React from 'react'
import { assertNever } from './assertNever'
import { ChildrenAnalyzerError } from './ChildrenAnalyzerError'
import { ChildrenAnalyzerOptions } from './ChildrenAnalyzerOptions'
import {
	BranchNodeRepresentationFactory,
	RawNodeRepresentation,
	RepresentationFactorySite,
	LeafRepresentationFactory,
	ValidFactoryName,
} from './nodeSpecs'
import { BaseComponent, EnvironmentFactory, SyntheticChildrenFactory } from './nodeSpecs/types'
import { BranchNodeList } from './BranchNodeList'
import { LeafList } from './LeafList'

export class ChildrenAnalyzer<
	AllLeafsRepresentation = any,
	AllBranchNodesRepresentation = never,
	Environment = undefined
> {
	private static defaultOptions: ChildrenAnalyzerOptions = {
		ignoreRenderProps: true,
		renderPropsErrorMessage: 'Render props (functions as React component children) are not supported.',

		environmentFactoryName: 'generateEnvironment',
		syntheticChildrenFactoryName: 'generateSyntheticChildren',
	}

	private readonly leafs: LeafList<AllLeafsRepresentation, Environment>
	private readonly branchNodes: BranchNodeList<AllLeafsRepresentation, AllBranchNodesRepresentation, Environment>
	private readonly options: ChildrenAnalyzerOptions

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
			throw new ChildrenAnalyzerError(this.options.renderPropsErrorMessage)
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

		let children: React.ReactNode

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
						| BranchNodeRepresentationFactory<any, unknown, AllBranchNodesRepresentation, Environment>
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
				if (leaf.specification.type === RepresentationFactorySite.DeclarationSite) {
					const { factoryMethodName } = leaf.specification

					if (factoryMethodName in treeNode) {
						const factory = treeNode[factoryMethodName] as LeafRepresentationFactory<
							any,
							AllLeafsRepresentation,
							Environment
						>
						return factory(node.props, environment)
					}
				} else if (leaf.specification.type === RepresentationFactorySite.UseSite) {
					const { ComponentType, factory } = leaf.specification
					if (ComponentType === undefined || node.type === ComponentType) {
						return factory(node.props, environment)
					}
				} else {
					return assertNever(leaf.specification)
				}
			}

			const processedChildren = this.processNode(children, environment)

			for (const branchNode of this.branchNodes) {
				if (branchNode.specification.type === RepresentationFactorySite.DeclarationSite) {
					const { factoryMethodName, childrenRepresentationReducer } = branchNode.specification

					if (factoryMethodName in treeNode) {
						if (!processedChildren) {
							throw new ChildrenAnalyzerError(branchNode.options.childrenAbsentErrorMessage)
						}
						const factory = treeNode[factoryMethodName] as BranchNodeRepresentationFactory<
							any,
							unknown,
							AllBranchNodesRepresentation,
							Environment
						>
						return factory(node.props, childrenRepresentationReducer(processedChildren), environment)
					}
				} else if (branchNode.specification.type === RepresentationFactorySite.UseSite) {
					const { factory, ComponentType, childrenRepresentationReducer } = branchNode.specification
					if (ComponentType === undefined || node.type === ComponentType) {
						if (!processedChildren) {
							throw new ChildrenAnalyzerError(branchNode.options.childrenAbsentErrorMessage)
						}
						return factory(node.props, childrenRepresentationReducer(processedChildren), environment)
					}
				} else {
					return assertNever(branchNode.specification)
				}
			}

			return processedChildren
		}
		return this.processNode(children, environment)
	}
}
