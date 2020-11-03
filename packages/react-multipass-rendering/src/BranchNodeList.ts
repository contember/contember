import { BranchNode, RawNodeRepresentation, ValidFactoryName } from './nodeSpecs'

export type BranchNodeList<LeavesRepresentationUnion, BranchNodesRepresentationUnion, StaticContext> = BranchNode<
	any,
	StaticContext,
	ValidFactoryName,
	RawNodeRepresentation<LeavesRepresentationUnion, BranchNodesRepresentationUnion>,
	any,
	BranchNodesRepresentationUnion
>[]
