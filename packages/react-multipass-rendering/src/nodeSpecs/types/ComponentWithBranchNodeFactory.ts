import { BaseComponent } from './BaseComponent'
import { DeclarationSiteNodeRepresentationFactory } from './DeclarationSiteNodeRepresentationFactory'
import { ValidFactoryName } from './ValidFactoryName'

export type ComponentWithBranchNodeFactory<
	FactoryMethodName extends ValidFactoryName,
	Props extends {},
	ReducedChildrenRepresentation,
	Representation,
	Environment
> = BaseComponent<Props> &
	{
		[N in FactoryMethodName]: DeclarationSiteNodeRepresentationFactory<
			Props,
			ReducedChildrenRepresentation,
			Representation,
			Environment
		>
	}
