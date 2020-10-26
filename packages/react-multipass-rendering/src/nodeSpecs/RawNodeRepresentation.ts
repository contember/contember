export type RawNodeRepresentation<AllLeavesRepresentation, AllBranchNodesRepresentation> =
	| AllLeavesRepresentation
	| AllBranchNodesRepresentation
	| Array<AllLeavesRepresentation | AllBranchNodesRepresentation>
	| undefined
