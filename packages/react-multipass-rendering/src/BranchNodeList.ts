import type { BranchNode, RawNodeRepresentation, ValidFactoryName } from './nodeSpecs/index.js'

export type BranchNodeList<LeavesRepresentationUnion, BranchNodesRepresentationUnion, StaticContext> = BranchNode<
	any,
	StaticContext,
	ValidFactoryName,
	RawNodeRepresentation<LeavesRepresentationUnion, BranchNodesRepresentationUnion>,
	any,
	BranchNodesRepresentationUnion
>[]
