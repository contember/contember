import {
	ComponentWithTerminalFactory,
	TerminalRepresentationFactory,
	RepresentationFactorySite,
	ValidFactoryName,
} from './types'

class Terminal<
	FactoryMethodName extends ValidFactoryName,
	Props extends {},
	Representation,
	ComponentType extends ComponentWithTerminalFactory<FactoryMethodName, Props, Environment, Representation>,
	Environment
> {
	public readonly specification: Terminal.Specification<
		FactoryMethodName,
		Props,
		Representation,
		ComponentType,
		Environment
	>

	public constructor(factoryMethodName: FactoryMethodName)
	public constructor(
		staticFactory: TerminalRepresentationFactory<Props, Environment, Representation>,
		ComponentType?: ComponentType,
	)
	public constructor(
		factory: FactoryMethodName | TerminalRepresentationFactory<Props, Environment, Representation>,
		ComponentType?: ComponentType,
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
		ComponentType extends ComponentWithTerminalFactory<FactoryMethodName, Props, Environment, Representation>,
		Environment
	> =
		| {
				type: RepresentationFactorySite.DeclarationSite
				factoryMethodName: FactoryMethodName
		  }
		| {
				type: RepresentationFactorySite.UseSite
				factory: TerminalRepresentationFactory<Props, Environment, Representation>
				ComponentType?: ComponentType
		  }
}
