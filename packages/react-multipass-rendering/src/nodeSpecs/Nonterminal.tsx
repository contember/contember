import { NonterminalOptions } from './NonterminalOptions'
import {
	BaseComponent,
	ChildrenRepresentationReducer,
	NonterminalRepresentationFactory,
	RepresentationFactorySite,
	ValidFactoryName,
} from './types'

class Nonterminal<
	FactoryMethodName extends ValidFactoryName = string,
	Props extends {} = {},
	ChildrenRepresentation = any,
	ReducedChildrenRepresentation = any,
	Representation = any,
	Environment = undefined
> {
	private static defaultOptions: NonterminalOptions = {
		childrenAbsentErrorMessage: 'Component must have children!',
	}

	public readonly specification: Nonterminal.Specification<
		FactoryMethodName,
		Props,
		ChildrenRepresentation,
		ReducedChildrenRepresentation,
		Representation,
		Environment
	>

	public readonly options: NonterminalOptions

	public constructor(
		factoryMethodName: FactoryMethodName,
		childrenRepresentationReducer: ChildrenRepresentationReducer<ChildrenRepresentation, ReducedChildrenRepresentation>,
		options?: Partial<NonterminalOptions>,
	)
	public constructor(
		staticFactory: NonterminalRepresentationFactory<Props, ReducedChildrenRepresentation, Representation, Environment>,
		childrenRepresentationReducer: ChildrenRepresentationReducer<ChildrenRepresentation, ReducedChildrenRepresentation>,
		options?: Partial<NonterminalOptions>,
		ComponentType?: BaseComponent<Props>,
	)
	public constructor(
		factory:
			| FactoryMethodName
			| NonterminalRepresentationFactory<Props, ReducedChildrenRepresentation, Representation, Environment>,
		childrenRepresentationReducer: ChildrenRepresentationReducer<ChildrenRepresentation, ReducedChildrenRepresentation>,
		options?: Partial<NonterminalOptions>,
		ComponentType?: BaseComponent<Props>,
	) {
		if (typeof factory === 'function') {
			this.specification = {
				type: RepresentationFactorySite.UseSite,
				factory,
				childrenRepresentationReducer,
				ComponentType,
			}
		} else {
			this.specification = {
				type: RepresentationFactorySite.DeclarationSite,
				factoryMethodName: factory,
				childrenRepresentationReducer,
			}
		}
		this.options = { ...Nonterminal.defaultOptions, ...options }
	}
}

namespace Nonterminal {
	export type Specification<
		FactoryMethodName extends ValidFactoryName = string,
		Props extends {} = {},
		ChildrenRepresentation = any,
		ReducedChildrenRepresentation = any,
		Representation = any,
		Environment = undefined
	> =
		| {
				type: RepresentationFactorySite.DeclarationSite
				factoryMethodName: FactoryMethodName
				childrenRepresentationReducer: ChildrenRepresentationReducer<
					ChildrenRepresentation,
					ReducedChildrenRepresentation
				>
		  }
		| {
				type: RepresentationFactorySite.UseSite
				factory: NonterminalRepresentationFactory<Props, ReducedChildrenRepresentation, Representation, Environment>
				childrenRepresentationReducer: ChildrenRepresentationReducer<
					ChildrenRepresentation,
					ReducedChildrenRepresentation
				>
				ComponentType?: BaseComponent<Props>
		  }
}

export { Nonterminal }
