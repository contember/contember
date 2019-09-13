import { BaseComponent } from './BaseComponent'
import { NonterminalRepresentationFactory } from './NonterminalRepresentationFactory'
import { ValidFactoryName } from './ValidFactoryName'

export type ComponentWithNonterminalFactory<
	FactoryMethodName extends ValidFactoryName,
	Props extends {},
	ReducedChildrenRepresentation,
	Representation,
	Environment
> = BaseComponent<Props> &
	{
		[N in FactoryMethodName]: NonterminalRepresentationFactory<
			Props,
			ReducedChildrenRepresentation,
			Representation,
			Environment
		>
	}
