import { Descendant, Element as SlateElement } from 'slate'
import { HtmlDeserializer } from '../plugins/behaviour/paste/HtmlDeserializer'

export type HtmlDeserializerNextCallback = (children: NodeList | Node[], cumulativeTextAttrs: HtmlDeserializerTextAttrs) => Descendant[];

export interface HtmlDeserializerTextAttrs {
	[key: string]: any
}

export type HtmlDeserializerNodesWithType =
	| { texts: Descendant[]; elements?: undefined }
	| { elements: SlateElement[]; texts?: undefined }
	| null

export interface HtmlDeserializerPlugin {
	processBlockPaste?: (
		args: {
			deserializer: HtmlDeserializer,
			element: HTMLElement,
			next: HtmlDeserializerNextCallback,
			cumulativeTextAttrs: HtmlDeserializerTextAttrs,
		}
	) => SlateElement[] | SlateElement | null
	processInlinePaste?: (
		args: {
			deserializer: HtmlDeserializer,
			element: HTMLElement,
			next: HtmlDeserializerNextCallback,
			cumulativeTextAttrs: HtmlDeserializerTextAttrs
		}
	) => Descendant[] | Descendant | null
	processAttributesPaste?: (args: {
		deserializer: HtmlDeserializer,
		element: HTMLElement,
		cumulativeTextAttrs: HtmlDeserializerTextAttrs,
	}) => HtmlDeserializerTextAttrs
	processNodeListPaste?: (args: {
		deserializer: HtmlDeserializer,
		nodeList: Node[],
		cumulativeTextAttrs: HtmlDeserializerTextAttrs,
	}) => HtmlDeserializerNodesWithType
}
