import { ChildrenAnalyzerError } from '../ChildrenAnalyzerError'
import { BranchNodeOptions } from './BranchNodeOptions'
import {
	BaseComponent,
	ChildrenRepresentationReducer,
	UseSiteBranchNodeRepresentationFactory,
	RepresentationFactorySite,
	ValidFactoryName,
} from './types'

class BranchNode<
	StaticContext = undefined,
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
		StaticContext,
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
		useSiteFactory: UseSiteBranchNodeRepresentationFactory<
			Props,
			ChildrenRepresentation,
			Representation,
			StaticContext
		>,
		ComponentType?: BaseComponent<Props>,
		options?: Partial<BranchNodeOptions>,
	)
	public constructor(
		factory:
			| FactoryMethodName
			| UseSiteBranchNodeRepresentationFactory<Props, ChildrenRepresentation, Representation, StaticContext>,
		componentOrReducer?:
			| ChildrenRepresentationReducer<ChildrenRepresentation, ReducedChildrenRepresentation>
			| BaseComponent<Props>,
		options?: Partial<BranchNodeOptions>,
	) {
		if (typeof factory !== 'function') {
			this.specification = {
				type: RepresentationFactorySite.DeclarationSite,
				factoryMethodName: factory,
				childrenRepresentationReducer: componentOrReducer as ChildrenRepresentationReducer<
					ChildrenRepresentation,
					ReducedChildrenRepresentation
				>,
			}
		} else if (typeof factory === 'function') {
			this.specification = {
				type: RepresentationFactorySite.UseSite,
				factory,
				ComponentType: componentOrReducer as BaseComponent<Props>,
			}
		} else {
			throw new ChildrenAnalyzerError('Invalid arguments')
		}
		this.options = {
			...BranchNode.defaultOptions,
			...options,
		}
	}
}

namespace BranchNode {
	export type Specification<
		StaticContext = any,
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
				factory: UseSiteBranchNodeRepresentationFactory<Props, ChildrenRepresentation, Representation, StaticContext>
				ComponentType?: BaseComponent<Props>
		  }
}

export { BranchNode }
