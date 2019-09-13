export type RawNodeRepresentation<AllTerminalsRepresentation, AllNonterminalsRepresentation> =
	| AllTerminalsRepresentation
	| AllNonterminalsRepresentation
	| Array<AllTerminalsRepresentation | AllNonterminalsRepresentation>
	| undefined
