import { Element, Node } from 'slate'
import { ResolvedDiscriminatedDatum } from '../../../discrimination'
import { EmbedHandler } from '../embed'

type ContemberEmbedElementType = '__contember_embed__'
export const contemberEmbedElementType: ContemberEmbedElementType = '__contember_embed__'

export interface ContemberEmbedElement extends Element {
	type: ContemberEmbedElementType
	embedHandler: ResolvedDiscriminatedDatum<EmbedHandler>
	entityKey: string
	source: string | undefined
	embedArtifacts: any | undefined
}

export const isContemberEmbedElement = (node: Node): node is ContemberEmbedElement =>
	Element.isElement(node) && node.type === contemberEmbedElementType
