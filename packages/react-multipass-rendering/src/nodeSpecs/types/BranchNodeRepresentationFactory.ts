export type BranchNodeRepresentationFactory<
	Props extends {},
	ReducedChildrenRepresentation,
	Representation,
	Environment
> = (
	props: Props,
	reducedChildrenRepresentation: ReducedChildrenRepresentation,
	environment: Environment,
) => Representation
