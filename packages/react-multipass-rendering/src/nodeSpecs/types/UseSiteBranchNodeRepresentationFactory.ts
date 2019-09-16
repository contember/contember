export type UseSiteBranchNodeRepresentationFactory<
	Props extends {},
	ChildrenRepresentation,
	Representation,
	Environment
> = (props: Props, childrenRepresentation: ChildrenRepresentation, environment: Environment) => Representation
