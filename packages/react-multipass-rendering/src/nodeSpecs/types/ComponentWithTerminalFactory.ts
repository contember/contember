import { BaseComponent } from './BaseComponent'
import { TerminalRepresentationFactory } from './TerminalRepresentationFactory'
import { ValidFactoryName } from './ValidFactoryName'

export type ComponentWithTerminalFactory<
	FactoryMethodName extends ValidFactoryName,
	Props extends {},
	Representation,
	Environment
> = BaseComponent<Props> &
	{
		[N in FactoryMethodName]: TerminalRepresentationFactory<Props, Representation, Environment>
	}
