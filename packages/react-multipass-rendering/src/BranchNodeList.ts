import { BranchNode, RawNodeRepresentation, ValidFactoryName } from './nodeSpecs'

export type BranchNodeList<LeafsRepresentationUnion, BranchNodesRepresentationUnion, StaticContext> = BranchNode<
	StaticContext,
	ValidFactoryName,
	any,
	RawNodeRepresentation<LeafsRepresentationUnion, BranchNodesRepresentationUnion>,
	any,
	BranchNodesRepresentationUnion
>[]
