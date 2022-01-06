import { EditorPasteUtils, HtmlDeserializerPlugin, NodesWithType } from '../../../baseEditor'
import { unorderedListElementType } from './UnorderedListElement'
import { orderedListElementType } from './OrderedListElement'
import { listItemElementType } from './ListItemElement'
import { Element as SlateElement } from 'slate'

export interface ListElementProperties {
	ordered: boolean
	properties: Record<string, unknown>
}

export interface ListHtmlDeserializerOptions {
	getListElementProperties?: (text: string) => ListElementProperties
}

const defaultGetListElementProperties = (text: string): ListElementProperties => {
	const firstChar = text[0]
	return {
		ordered: firstChar === 'o' ? false : firstChar.match(/^\w$/) !== null,
		properties: {},
	}
}

export const listHtmlDeserializerFactory = ({ getListElementProperties = defaultGetListElementProperties }: ListHtmlDeserializerOptions = {}): HtmlDeserializerPlugin => ({
	processBlockPaste: ({ element, next, cumulativeTextAttrs }) => {
		if (element.tagName === 'UL') {
			return [{ type: unorderedListElementType, children: next(element.childNodes, cumulativeTextAttrs) }]
		}
		if (element.tagName === 'OL') {
			return [{ type: orderedListElementType, children: next(element.childNodes, cumulativeTextAttrs) }]
		}
		if (element.tagName === 'LI') {
			return [{ type: listItemElementType, children: next(element.childNodes, cumulativeTextAttrs) }]
		}
		return null
	},
	processNodeListPaste: ({ nodeList, cumulativeTextAttrs, deserializer }) => {
		const result: NodesWithType[] = []
		let group: Node[] = []
		let groupWasList = false
		let isOrdered: boolean = false
		let currentListProperties: Record<string, unknown> = {}
		let includesList = false
		let lastListId: string | null = null

		const processGroup = (): NodesWithType => {
			if (groupWasList) {
				return {
					elements: [
						{
							type: isOrdered ? orderedListElementType : unorderedListElementType,
							...currentListProperties,
							children: group.map(item => {
								return {
									type: listItemElementType,
									children: deserializer.deserializeBlocks(
										EditorPasteUtils.wordPasteListItemContent(item.childNodes),
										cumulativeTextAttrs,
									),
								}
							}),
						} as SlateElement,
					],
				}
			} else {
				return deserializer.processNodeListPaste(group, cumulativeTextAttrs)
			}
		}

		for (let i = 0; i < nodeList.length; i++) {
			const curr = nodeList[i]
			const isWhiteSpace = curr.nodeType === Node.TEXT_NODE && curr.textContent?.match(/^\s*$/) !== null
			if (groupWasList && isWhiteSpace) {
				continue
			}
			let isList = false
			let listId: string | null = null
			if (curr instanceof HTMLElement && curr.nodeName === 'P') {
				const match = curr.getAttribute('style')?.match(/mso-list:(\w+ level\d+ \w+)/) ?? null
				if (match !== null) {
					isList = true
					listId = match[1]

					if (!groupWasList || lastListId === listId) {
						const textContent = (curr as HTMLElement).textContent!
						const specifics: ListElementProperties = getListElementProperties(textContent)
						isOrdered = specifics.ordered
						currentListProperties = specifics.properties
					}
				}
			}

			if (isList !== groupWasList || listId !== lastListId) {
				includesList = true
				if (group.length > 0) {
					result.push(processGroup())
					group = []
				}
			}
			groupWasList = isList
			lastListId = listId
			group.push(curr)
		}

		if (includesList) {
			result.push(processGroup())
			return EditorPasteUtils.flattenNodesWithType(result, deserializer.createDefaultElement)
		}
		return null
	},
})
