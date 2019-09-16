export type LeafRepresentationFactory<Props extends {}, Representation, Environment> = (
	props: Props,
	environment: Environment,
) => Representation
