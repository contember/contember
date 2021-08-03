import type { ElementType } from 'react'
import type {
	ConstrainedLeafRepresentationFactory,
	UnconstrainedLeafRepresentationFactory,
	ValidFactoryName,
} from './types'

class Leaf<
	Props extends {} = {},
	StaticContext = any,
	FactoryMethodName extends ValidFactoryName = string,
	Representation = any,
> {
	public readonly specification: Leaf.Specification<FactoryMethodName, Representation, Props, StaticContext>

	public constructor(factoryMethodName: FactoryMethodName)
	public constructor(staticFactory: UnconstrainedLeafRepresentationFactory<Props, Representation, StaticContext>)
	public constructor(
		staticFactory: ConstrainedLeafRepresentationFactory<Props, Representation, StaticContext>,
		ComponentType: ElementType<Props>,
	)
	public constructor(
		factory: FactoryMethodName | UnconstrainedLeafRepresentationFactory<Props, Representation, StaticContext>,
		ComponentType?: ElementType<Props>,
	) {
		if (typeof factory === 'function') {
			this.specification = {
				type: 'useSite',
				ComponentType,
				factory,
			}
		} else {
			this.specification = {
				type: 'declarationSite',
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
		StaticContext,
	> =
		| {
				type: 'declarationSite'
				factoryMethodName: FactoryMethodName
		  }
		| {
				type: 'useSite'
				factory: UnconstrainedLeafRepresentationFactory<Props, Representation, StaticContext>
				ComponentType?: ElementType<Props>
		  }
}

export { Leaf }
