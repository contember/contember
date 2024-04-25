import { Descendant, Element as SlateElement } from 'slate'
import { HtmlDeserializer, NodesWithType, TextAttrs } from './HtmlDeserializer'

export type HtmlDeserializerNextCallback = (children: NodeList | Node[], cumulativeTextAttrs: TextAttrs) => Descendant[];

export interface HtmlDeserializerPlugin {
	processBlockPaste?: (
		args: {
			deserializer: HtmlDeserializer,
			element: HTMLElement,
			next: HtmlDeserializerNextCallback,
			cumulativeTextAttrs: TextAttrs,
		}
	) => SlateElement[] | SlateElement | null
	processInlinePaste?: (
		args: {
			deserializer: HtmlDeserializer,
			element: HTMLElement,
			next: HtmlDeserializerNextCallback,
			cumulativeTextAttrs: TextAttrs
		}
	) => Descendant[] | Descendant | null
	processAttributesPaste?: (args: {
		deserializer: HtmlDeserializer,
		element: HTMLElement,
		cumulativeTextAttrs: TextAttrs,
	}) => TextAttrs
	processNodeListPaste?: (args: {
		deserializer: HtmlDeserializer,
		nodeList: Node[],
		cumulativeTextAttrs: TextAttrs,
	}) => NodesWithType
}
