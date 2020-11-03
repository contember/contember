import { Leaf, ValidFactoryName } from './nodeSpecs'

export type LeafList<RepresentationUnion, StaticContext> = Leaf<
	any,
	StaticContext,
	ValidFactoryName,
	RepresentationUnion
>[]
