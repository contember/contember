export type UseSiteBranchNodeRepresentationFactory<
	Props extends {},
	ChildrenRepresentation,
	Representation,
	StaticContext
> = (props: Props, childrenRepresentation: ChildrenRepresentation, staticContext: StaticContext) => Representation
