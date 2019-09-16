import { BranchNodeOptions } from './BranchNodeOptions'
import {
	BaseComponent,
	ChildrenRepresentationReducer,
	BranchNodeRepresentationFactory,
	RepresentationFactorySite,
	ValidFactoryName,
} from './types'

class BranchNode<
	Environment = undefined,
	FactoryMethodName extends ValidFactoryName = string,
	Props extends {} = {},
	ChildrenRepresentation = any,
	ReducedChildrenRepresentation = any,
	Representation = any
> {
	private static defaultOptions: BranchNodeOptions = {
		childrenAbsentErrorMessage: 'Component must have children!',
	}

	public readonly specification: BranchNode.Specification<
		Environment,
		FactoryMethodName,
		Props,
		ChildrenRepresentation,
		ReducedChildrenRepresentation,
		Representation
	>

	public readonly options: BranchNodeOptions

	public constructor(
		factoryMethodName: FactoryMethodName,
		childrenRepresentationReducer: ChildrenRepresentationReducer<ChildrenRepresentation, ReducedChildrenRepresentation>,
		options?: Partial<BranchNodeOptions>,
	)
	public constructor(
		staticFactory: BranchNodeRepresentationFactory<Props, ReducedChildrenRepresentation, Representation, Environment>,
		childrenRepresentationReducer: ChildrenRepresentationReducer<ChildrenRepresentation, ReducedChildrenRepresentation>,
		options?: Partial<BranchNodeOptions>,
		ComponentType?: BaseComponent<Props>,
	)
	public constructor(
		factory:
			| FactoryMethodName
			| BranchNodeRepresentationFactory<Props, ReducedChildrenRepresentation, Representation, Environment>,
		childrenRepresentationReducer: ChildrenRepresentationReducer<ChildrenRepresentation, ReducedChildrenRepresentation>,
		options?: Partial<BranchNodeOptions>,
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
		this.options = { ...BranchNode.defaultOptions, ...options }
	}
}

namespace BranchNode {
	export type Specification<
		Environment = any,
		FactoryMethodName extends ValidFactoryName = string,
		Props extends {} = {},
		ChildrenRepresentation = any,
		ReducedChildrenRepresentation = any,
		Representation = any
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
				factory: BranchNodeRepresentationFactory<Props, ReducedChildrenRepresentation, Representation, Environment>
				childrenRepresentationReducer: ChildrenRepresentationReducer<
					ChildrenRepresentation,
					ReducedChildrenRepresentation
				>
				ComponentType?: BaseComponent<Props>
		  }
}

export { BranchNode }
