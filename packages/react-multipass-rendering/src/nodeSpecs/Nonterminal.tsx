import { NonterminalOptions } from './NonterminalOptions'
import {
	ChildrenRepresentationReducer,
	ComponentWithNonterminalFactory,
	NonterminalRepresentationFactory,
	RepresentationFactorySite,
	ValidFactoryName,
} from './types'

class Nonterminal<
	FactoryMethodName extends ValidFactoryName,
	Props extends {},
	ChildrenRepresentation,
	ReducedChildrenRepresentation,
	Representation,
	ComponentType extends ComponentWithNonterminalFactory<
		FactoryMethodName,
		Props,
		ReducedChildrenRepresentation,
		Representation,
		Environment
	>,
	Environment
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
		ComponentType,
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
		ComponentType?: ComponentType,
	)
	public constructor(
		factory:
			| FactoryMethodName
			| NonterminalRepresentationFactory<Props, ReducedChildrenRepresentation, Representation, Environment>,
		childrenRepresentationReducer: ChildrenRepresentationReducer<ChildrenRepresentation, ReducedChildrenRepresentation>,
		options?: Partial<NonterminalOptions>,
		ComponentType?: ComponentType,
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
		FactoryMethodName extends ValidFactoryName,
		Props extends {},
		ChildrenRepresentation,
		ReducedChildrenRepresentation,
		Representation,
		ComponentType extends ComponentWithNonterminalFactory<
			FactoryMethodName,
			Props,
			ReducedChildrenRepresentation,
			Representation,
			Environment
		>,
		Environment
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
				ComponentType?: ComponentType
		  }
}

export { Nonterminal }
