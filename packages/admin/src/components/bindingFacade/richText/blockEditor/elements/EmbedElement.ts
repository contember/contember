import { Element, Node } from 'slate'

type EmbedElementType = 'embed'
export const embedElementType: EmbedElementType = 'embed'

export interface EmbedElement extends Element {
	type: EmbedElementType
	referenceId: string
	// embedHandler: ResolvedDiscriminatedDatum<EmbedHandler>
	// entityKey: string
	// source: string | undefined
	// embedArtifacts: any | undefined
}

export const isEmbedElement = (node: Node): node is EmbedElement =>
	Element.isElement(node) && node.type === embedElementType
