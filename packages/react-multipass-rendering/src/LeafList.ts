import { Leaf, ValidFactoryName } from './nodeSpecs'

export type LeafList<RepresentationUnion, StaticContext> = Leaf<
	StaticContext,
	ValidFactoryName,
	RepresentationUnion,
	any
>[]
