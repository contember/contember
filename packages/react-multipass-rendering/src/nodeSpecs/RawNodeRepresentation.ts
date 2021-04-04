export type RawNodeRepresentation<AllLeavesRepresentation, AllBranchNodesRepresentation = AllLeavesRepresentation> =
	| AllLeavesRepresentation
	| AllBranchNodesRepresentation
	| Array<AllLeavesRepresentation | AllBranchNodesRepresentation>
	| undefined
