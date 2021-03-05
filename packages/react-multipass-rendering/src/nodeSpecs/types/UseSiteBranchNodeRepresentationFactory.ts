import { ReactElement } from 'react'

export type UseSiteBranchNodeRepresentationFactory<
	Props extends {},
	ChildrenRepresentation,
	Representation,
	StaticContext
> = (
	node: ReactElement<Props, any>,
	childrenRepresentation: ChildrenRepresentation,
	staticContext: StaticContext,
) => Representation
