import { Descendant, Element as SlateElement, Text as SlateText } from 'slate'
import { HtmlDeserializerNextCallback, HtmlDeserializerPlugin } from '../../../types/htmlDeserializer'
import { EditorDefaultElementFactory } from '../../../types/editor'

const ignoredElements = ['SCRIPT', 'STYLE', 'TEMPLATE']

export interface TextAttrs {
	[key: string]: any
}

export type NodesWithTypeFiltered =
	| { texts: Descendant[]; elements?: undefined }
	| { elements: SlateElement[]; texts?: undefined }

export type NodesWithType = NodesWithTypeFiltered | null

export class HtmlDeserializer {
	constructor(
		public createDefaultElement: EditorDefaultElementFactory,
		private plugins: HtmlDeserializerPlugin[],
	) {
	}

	registerPlugin(plugin: HtmlDeserializerPlugin, prepend: boolean = true) {
		prepend ? this.plugins.unshift(plugin) : this.plugins.push(plugin)
	}

	public processNodeListPaste(nodeList: Node[], cumulativeTextAttrs: TextAttrs) {
		for (const plugin of this.plugins) {
			const result = plugin.processNodeListPaste?.({ nodeList, cumulativeTextAttrs, deserializer: this }) ?? null
			if (result !== null) {
				return result
			}
		}
		const processed: (
			| { text: SlateText | SlateElement; element?: undefined; isWhiteSpace: boolean }
			| { element: SlateElement; text?: undefined }
		)[] = []

		for (const childNode of nodeList) {
			const isWhiteSpace = childNode.nodeType === Node.TEXT_NODE && childNode.textContent?.match(/^\s*$/) !== null

			// Block
			const attrs = this.processWithAttributeProcessor(childNode, cumulativeTextAttrs)
			const result =
				childNode instanceof HTMLElement
					? this.processBlockPaste(
						childNode,
						cumulativeTextAttrs,
					)
					: null
			if (result !== null) {
				processed.push(...(Array.isArray(result) ? result : [result]).map(element => ({ element })))
			} else {
				// Inline
				const result = this.deserializeTextNode(childNode, cumulativeTextAttrs)
				if (result !== null) {
					processed.push(...result.map(text => ({ text, isWhiteSpace })))
				} else {
					// Unknown element
					const deserializedChildren = this.processNodeListPaste(
						Array.from(childNode.childNodes),
						attrs,
					)
					processed.push(
						...(deserializedChildren === null
							? []
							: deserializedChildren.texts !== undefined
								? deserializedChildren.texts.map(text => ({ text, isWhiteSpace }))
								: deserializedChildren.elements.map(element => ({ element }))),
					)
				}
			}
		}

		if (processed.length === 0) {
			return null
		}

		const containsBlock = processed.find(({ element }) => element !== undefined) !== undefined

		if (containsBlock) {
			return {
				elements: processed.flatMap(item => {
					if (item.text !== undefined) {
						return item.isWhiteSpace ? [] : [this.createDefaultElement(this.trimBlockBoundaryWhitespace([item.text]))]
					} else if (item.element !== undefined) {
						return [item.element]
					}
					{
						return []
					}
				}),
			}
		} else {
			return { texts: processed.map(item => item.text as SlateText) }
		}
	}

	deserializeInline(list: NodeList | Node[], cumulativeTextAttrs: TextAttrs): Descendant[] {
		return Array.from(list).flatMap(childNode => {
			const result = this.deserializeTextNode(childNode, cumulativeTextAttrs)
			if (result !== null) {
				return result
			} else {
				const attrs = this.processWithAttributeProcessor(childNode, cumulativeTextAttrs)
				return this.deserializeInline(childNode.childNodes, attrs)
			}
		})
	}

	deserializeBlocks(list: Node[], cumulativeTextAttrs: TextAttrs): Descendant[] {
		const result = this.processNodeListPaste(list, cumulativeTextAttrs)
		if (result?.texts !== undefined) {
			return this.trimBlockBoundaryWhitespace(result.texts)
		}
		return result?.elements ?? []
	}

	// Collapsible whitespace at the start/end of a block renders as nothing in HTML,
	// so strip it from the edges of a block's inline content. Non-breaking spaces are kept.
	private trimBlockBoundaryWhitespace(texts: Descendant[]): Descendant[] {
		const trimmed = [...texts]
		const trimEdge = (direction: 'start' | 'end') => {
			for (let i = direction === 'start' ? 0 : trimmed.length - 1; i >= 0 && i < trimmed.length;) {
				const node = trimmed[i]
				if (!SlateText.isText(node)) {
					return
				}
				const text = direction === 'start' ? node.text.replace(/^[ \t\r\n]+/, '') : node.text.replace(/[ \t\r\n]+$/, '')
				if (text !== '') {
					trimmed[i] = { ...node, text }
					return
				}
				if (trimmed.length === 1) {
					trimmed[i] = { ...node, text }
					return
				}
				trimmed.splice(i, 1)
				if (direction === 'end') {
					i--
				}
			}
		}
		trimEdge('start')
		trimEdge('end')
		return trimmed
	}


	private deserializeTextNode(node: Node, cumulativeTextAttrs: TextAttrs): Descendant[] | null {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent ?? ''
			return [{ ...cumulativeTextAttrs, text: text.replace(/[ \t]*(?:\r?\n[ \t]*)+/g, ' ') }]
		} else if (node instanceof HTMLElement) {
			const result = this.processInlinePaste(
				node,
				cumulativeTextAttrs,
			)
			if (result !== null) {
				return Array.isArray(result) ? result : [result]
			}
		}

		return null
	}

	private processInlinePaste(element: HTMLElement, cumulativeTextAttrs: TextAttrs): (SlateElement | SlateText)[] | SlateElement | SlateText | null {
		if (ignoredElements.includes(element.tagName)) {
			return []
		}
		if (element.tagName === 'BR') {
			return { ...cumulativeTextAttrs, text: ' ' }
		}
		const next: HtmlDeserializerNextCallback = (list, cta) => {
			const attrs = this.processWithAttributeProcessor(element, cta)
			return this.deserializeInline(list, attrs)
		}
		for (const plugin of this.plugins) {
			const result = plugin.processInlinePaste?.({ element, next, cumulativeTextAttrs, deserializer: this }) ?? null
			if (result !== null) {
				return result
			}
		}
		return null
	}

	private processWithAttributeProcessor(element: Node, cumulativeTextAttrs: TextAttrs): TextAttrs {
		if (!(element instanceof HTMLElement)) {
			return {}
		}
		return this.plugins.reduce(
			(cta, plugin) => plugin.processAttributesPaste?.({ element, cumulativeTextAttrs, deserializer: this  }) ?? cta,
			cumulativeTextAttrs,
		)
	}

	private processBlockPaste(element: HTMLElement, cumulativeTextAttrs: TextAttrs): SlateElement[] | SlateElement | null {
		if (ignoredElements.includes(element.tagName)) {
			return []
		}
		const next: HtmlDeserializerNextCallback = (list, cta) =>
			this.deserializeBlocks(Array.from(list), { ...cumulativeTextAttrs, ...cta })

		for (const plugin of this.plugins) {
			const result = plugin.processBlockPaste?.({ element, next, cumulativeTextAttrs, deserializer: this }) ?? null
			if (result !== null) {
				return result
			}
		}
		return null
	}
}
