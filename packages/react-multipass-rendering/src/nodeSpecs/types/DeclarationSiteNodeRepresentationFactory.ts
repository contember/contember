export type DeclarationSiteNodeRepresentationFactory<
	Props extends {},
	ReducedChildrenRepresentation,
	Representation,
	StaticContext
> = (
	props: Props,
	reducedChildrenRepresentation: ReducedChildrenRepresentation,
	staticContext: StaticContext,
) => Representation
