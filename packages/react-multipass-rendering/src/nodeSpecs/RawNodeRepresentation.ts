export type RawNodeRepresentation<AllLeafsRepresentation, AllBranchNodesRepresentation> =
	| AllLeafsRepresentation
	| AllBranchNodesRepresentation
	| Array<AllLeafsRepresentation | AllBranchNodesRepresentation>
	| undefined
