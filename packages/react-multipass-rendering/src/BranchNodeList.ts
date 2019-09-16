import { BranchNode, RawNodeRepresentation, ValidFactoryName } from './nodeSpecs'

export type BranchNodeList<LeafsRepresentationUnion, BranchNodesRepresentationUnion, Environment> = BranchNode<
	Environment,
	ValidFactoryName,
	any,
	RawNodeRepresentation<LeafsRepresentationUnion, BranchNodesRepresentationUnion>,
	any,
	BranchNodesRepresentationUnion
>[]
