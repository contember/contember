import { BaseComponent } from './BaseComponent'
import { LeafRepresentationFactory } from './LeafRepresentationFactory'
import { ValidFactoryName } from './ValidFactoryName'

export type ComponentWithLeafFactory<
	FactoryMethodName extends ValidFactoryName,
	Props extends {},
	Representation,
	Environment
> = BaseComponent<Props> &
	{
		[N in FactoryMethodName]: LeafRepresentationFactory<Props, Representation, Environment>
	}
