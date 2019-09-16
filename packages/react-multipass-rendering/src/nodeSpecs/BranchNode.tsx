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
		useSiteFactory: UseSiteBranchNodeRepresentationFactory<Props, ChildrenRepresentation, Representation, Environment>,
		options?: Partial<BranchNodeOptions>,
		ComponentType?: BaseComponent<Props>,
	)
	public constructor(
		factory:
			| FactoryMethodName
			| UseSiteBranchNodeRepresentationFactory<Props, ChildrenRepresentation, Representation, Environment>,
		optionsOrReducer?:
			| Partial<BranchNodeOptions>
			| ChildrenRepresentationReducer<ChildrenRepresentation, ReducedChildrenRepresentation>,
		optionsOrComponentType?: Partial<BranchNodeOptions> | BaseComponent<Props>,
	) {
		if (typeof factory === 'function' && typeof optionsOrComponentType === 'function') {
			this.specification = {
				type: RepresentationFactorySite.UseSite,
				factory,
				ComponentType: optionsOrComponentType,
			}
		} else if (typeof factory !== 'function' && typeof optionsOrReducer === 'function') {
			this.specification = {
				type: RepresentationFactorySite.DeclarationSite,
				factoryMethodName: factory,
				childrenRepresentationReducer: optionsOrReducer,
			}
		} else {
			throw new ChildrenAnalyzerError('Invalid arguments')
		}
		this.options = {
			...BranchNode.defaultOptions,
			...(typeof optionsOrReducer === 'object' ? optionsOrReducer : optionsOrComponentType),
		}
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
				factory: UseSiteBranchNodeRepresentationFactory<Props, ChildrenRepresentation, Representation, Environment>
				ComponentType?: BaseComponent<Props>
		  }
}

export { BranchNode }
