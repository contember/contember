import { BaseComponent, RepresentationFactorySite, TerminalRepresentationFactory, ValidFactoryName } from './types'

class Terminal<
	FactoryMethodName extends ValidFactoryName = string,
	Props extends {} = {},
	Representation = any,
	Environment = undefined
> {
	public readonly specification: Terminal.Specification<FactoryMethodName, Props, Representation, Environment>

	public constructor(factoryMethodName: FactoryMethodName)
	public constructor(
		staticFactory: TerminalRepresentationFactory<Props, Representation, Environment>,
		ComponentType?: BaseComponent<Props>,
	)
	public constructor(
		factory: FactoryMethodName | TerminalRepresentationFactory<Props, Representation, Environment>,
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

namespace Terminal {
	export type Specification<
		FactoryMethodName extends ValidFactoryName,
		Props extends {},
		Representation,
		Environment
	> =
		| {
				type: RepresentationFactorySite.DeclarationSite
				factoryMethodName: FactoryMethodName
		  }
		| {
				type: RepresentationFactorySite.UseSite
				factory: TerminalRepresentationFactory<Props, Representation, Environment>
				ComponentType?: BaseComponent<Props>
		  }
}

export { Terminal }
