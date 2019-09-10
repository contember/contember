export type NonterminalRepresentationFactory<
	Props extends {},
	ReducedChildrenRepresentation,
	Representation,
	Environment
> = (
	props: Props,
	reducedChildrenRepresentation: ReducedChildrenRepresentation,
	environment: Environment,
) => Representation
