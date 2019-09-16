import { Leaf, ValidFactoryName } from './nodeSpecs'

export type LeafList<RepresentationUnion, Environment> = Leaf<Environment, ValidFactoryName, RepresentationUnion, any>[]
