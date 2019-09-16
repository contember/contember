import * as React from 'react'
import { assertNever } from './assertNever'
import { ChildrenAnalyzerError } from './ChildrenAnalyzerError'
import { ChildrenAnalyzerOptions } from './ChildrenAnalyzerOptions'
import {
	NonterminalRepresentationFactory,
	RawNodeRepresentation,
	RepresentationFactorySite,
	TerminalRepresentationFactory,
	ValidFactoryName,
} from './nodeSpecs'
import { BaseComponent, EnvironmentFactory, SyntheticChildrenFactory } from './nodeSpecs/types'
import { NonterminalList } from './NonterminalList'
import { TerminalList } from './TerminalList'

export class ChildrenAnalyzer<
	AllTerminalsRepresentation = any,
	AllNonterminalsRepresentation = never,
	Environment = undefined
> {
	private static defaultOptions: ChildrenAnalyzerOptions = {
		ignoreRenderProps: true,
		renderPropsErrorMessage: 'Render props (functions as React component children) are not supported.',

		environmentFactoryName: 'generateEnvironment',
		syntheticChildrenFactoryName: 'generateSyntheticChildren',
	}

	private readonly terminals: TerminalList<AllTerminalsRepresentation, Environment>
	private readonly nonterminals: NonterminalList<AllTerminalsRepresentation, AllNonterminalsRepresentation, Environment>
	private readonly options: ChildrenAnalyzerOptions

	public constructor(
		terminals: TerminalList<AllTerminalsRepresentation, Environment>,
		options?: Partial<ChildrenAnalyzerOptions>,
	)
	public constructor(
		terminals: TerminalList<AllTerminalsRepresentation, Environment>,
		nonterminals: NonterminalList<AllTerminalsRepresentation, AllNonterminalsRepresentation, Environment>,
		options?: Partial<ChildrenAnalyzerOptions>,
	)
	public constructor(
		terminals: TerminalList<AllTerminalsRepresentation, Environment>,
		decider:
			| Partial<ChildrenAnalyzerOptions>
			| NonterminalList<AllTerminalsRepresentation, AllNonterminalsRepresentation, Environment> = [],
		options: Partial<ChildrenAnalyzerOptions> = {},
	) {
		this.terminals = terminals

		if (Array.isArray(decider)) {
			this.nonterminals = decider
		} else {
			this.nonterminals = []
			options = decider
		}
		this.options = { ...ChildrenAnalyzer.defaultOptions, ...options }
	}

	public processChildren(
		children: React.ReactNode,
		initialEnvironment: Environment,
	): Array<AllTerminalsRepresentation | AllNonterminalsRepresentation> {
		const processed = this.processNode(children, initialEnvironment)

		const rawResult: Array<AllTerminalsRepresentation | AllNonterminalsRepresentation | undefined> = Array.isArray(
			processed,
		)
			? processed
			: [processed]

		return rawResult.filter(
			(item): item is AllTerminalsRepresentation | AllNonterminalsRepresentation => item !== undefined,
		)
	}

	private processNode(
		node: React.ReactNode | Function,
		environment: Environment,
	): RawNodeRepresentation<AllTerminalsRepresentation, AllNonterminalsRepresentation> {
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
			let mapped: Array<AllTerminalsRepresentation | AllNonterminalsRepresentation> = []

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
						| TerminalRepresentationFactory<any, AllTerminalsRepresentation, Environment>
						| NonterminalRepresentationFactory<any, unknown, AllNonterminalsRepresentation, Environment>
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

			for (const terminal of this.terminals) {
				if (terminal.specification.type === RepresentationFactorySite.DeclarationSite) {
					const { factoryMethodName } = terminal.specification

					if (factoryMethodName in treeNode) {
						const factory = treeNode[factoryMethodName] as TerminalRepresentationFactory<
							any,
							AllTerminalsRepresentation,
							Environment
						>
						return factory(node.props, environment)
					}
				} else if (terminal.specification.type === RepresentationFactorySite.UseSite) {
					const { ComponentType, factory } = terminal.specification
					if (ComponentType === undefined || node.type === ComponentType) {
						return factory(node.props, environment)
					}
				} else {
					return assertNever(terminal.specification)
				}
			}

			const processedChildren = this.processNode(children, environment)

			for (const nonterminal of this.nonterminals) {
				if (nonterminal.specification.type === RepresentationFactorySite.DeclarationSite) {
					const { factoryMethodName, childrenRepresentationReducer } = nonterminal.specification

					if (factoryMethodName in treeNode) {
						if (!processedChildren) {
							throw new ChildrenAnalyzerError(nonterminal.options.childrenAbsentErrorMessage)
						}
						const factory = treeNode[factoryMethodName] as NonterminalRepresentationFactory<
							any,
							unknown,
							AllNonterminalsRepresentation,
							Environment
						>
						return factory(node.props, childrenRepresentationReducer(processedChildren), environment)
					}
				} else if (nonterminal.specification.type === RepresentationFactorySite.UseSite) {
					const { factory, ComponentType, childrenRepresentationReducer } = nonterminal.specification
					if (ComponentType === undefined || node.type === ComponentType) {
						if (!processedChildren) {
							throw new ChildrenAnalyzerError(nonterminal.options.childrenAbsentErrorMessage)
						}
						return factory(node.props, childrenRepresentationReducer(processedChildren), environment)
					}
				} else {
					return assertNever(nonterminal.specification)
				}
			}

			return processedChildren
		}
		return this.processNode(children, environment)
	}
}
