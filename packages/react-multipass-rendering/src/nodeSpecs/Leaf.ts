import { BaseComponent, RepresentationFactorySite, LeafRepresentationFactory, ValidFactoryName } from './types'

class Leaf<
	Environment = any,
	FactoryMethodName extends ValidFactoryName = string,
	Representation = any,
	Props extends {} = {}
> {
	public readonly specification: Leaf.Specification<FactoryMethodName, Representation, Props, Environment>

	public constructor(factoryMethodName: FactoryMethodName)
	public constructor(
		staticFactory: LeafRepresentationFactory<Props, Representation, Environment>,
		ComponentType?: BaseComponent<Props>,
	)
	public constructor(
		factory: FactoryMethodName | LeafRepresentationFactory<Props, Representation, Environment>,
		ComponentType?: BaseComponent<Props>,
	) {
		if (typeof factory === 'function') {
			this.specification = {
				type: RepresentationFactorySite.UseSite,
				ComponentType,
				factory,
			}
		} else {
			this.specification = {
				type: RepresentationFactorySite.DeclarationSite,
				factoryMethodName: factory,
			}
		}
	}
}

namespace Leaf {
	export type Specification<
		FactoryMethodName extends ValidFactoryName,
		Representation,
		Props extends {},
		Environment
	> =
		| {
				type: RepresentationFactorySite.DeclarationSite
				factoryMethodName: FactoryMethodName
		  }
		| {
				type: RepresentationFactorySite.UseSite
				factory: LeafRepresentationFactory<Props, Representation, Environment>
				ComponentType?: BaseComponent<Props>
		  }
}

export { Leaf }
