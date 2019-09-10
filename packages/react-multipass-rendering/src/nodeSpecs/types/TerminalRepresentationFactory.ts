export type TerminalRepresentationFactory<Props extends {}, Representation, Environment> = (
	props: Props,
	environment: Environment,
) => Representation
