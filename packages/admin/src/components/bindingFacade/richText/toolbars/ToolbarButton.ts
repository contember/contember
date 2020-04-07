import { IconSourceSpecification } from '@contember/ui'
import { ElementNode, ElementSpecifics, TextNode, TextSpecifics } from '../baseEditor'

export interface MarkSpecificToolbarButton<T extends TextNode> {
	marks: TextSpecifics<T>
}

export interface ElementSpecificToolbarButton<E extends ElementNode> {
	elementType: E['type']
	suchThat?: ElementSpecifics<E>
}

export interface CommonToolbarButton extends IconSourceSpecification {
	title?: string // TODO add tooltip support
}

export type ElementToolbarButton<E extends ElementNode> = CommonToolbarButton & ElementSpecificToolbarButton<E>
export type MarkToolbarButton<T extends TextNode> = CommonToolbarButton & MarkSpecificToolbarButton<T>

export type ToolbarButton = ElementToolbarButton<any> | MarkToolbarButton<any>
