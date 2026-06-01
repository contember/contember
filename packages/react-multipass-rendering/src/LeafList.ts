import type { Leaf, ValidFactoryName } from './nodeSpecs/index.js'

export type LeafList<RepresentationUnion, StaticContext> = Leaf<
	any,
	StaticContext,
	ValidFactoryName,
	RepresentationUnion
>[]
