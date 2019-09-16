import { BaseComponent } from './BaseComponent'
import { BranchNodeRepresentationFactory } from './BranchNodeRepresentationFactory'
import { ValidFactoryName } from './ValidFactoryName'

export type ComponentWithBranchNodeFactory<
	FactoryMethodName extends ValidFactoryName,
	Props extends {},
	ReducedChildrenRepresentation,
	Representation,
	Environment
> = BaseComponent<Props> &
	{
		[N in FactoryMethodName]: BranchNodeRepresentationFactory<
			Props,
			ReducedChildrenRepresentation,
			Representation,
			Environment
		>
	}
