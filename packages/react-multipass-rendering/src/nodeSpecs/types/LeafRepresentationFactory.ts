export type LeafRepresentationFactory<Props extends {}, Representation, StaticContext> = (
	props: Props,
	staticContext: StaticContext,
) => Representation
