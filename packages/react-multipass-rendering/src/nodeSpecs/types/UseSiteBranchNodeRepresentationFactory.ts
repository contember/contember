import * as React from 'react'

export type UseSiteBranchNodeRepresentationFactory<
	Props extends {},
	ChildrenRepresentation,
	Representation,
	StaticContext
> = (
	node: React.ReactElement<Props, any>,
	childrenRepresentation: ChildrenRepresentation,
	staticContext: StaticContext,
) => Representation
