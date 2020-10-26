import { BranchNode, RawNodeRepresentation, ValidFactoryName } from './nodeSpecs'

export type BranchNodeList<LeavesRepresentationUnion, BranchNodesRepresentationUnion, StaticContext> = BranchNode<
	StaticContext,
	ValidFactoryName,
	any,
	RawNodeRepresentation<LeavesRepresentationUnion, BranchNodesRepresentationUnion>,
	any,
	BranchNodesRepresentationUnion
>[]
