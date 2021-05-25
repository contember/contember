import type { EditorNode, ElementNode, TextNode } from '../Node'
import type { WithEssentials } from '../EditorWithEssentials'
import { Transforms } from 'slate'

type Children = (ElementNode | TextNode)[]
export interface TextAttrs {
	[key: string]: any
}
export type NodesWithTypeFiltered =
	| { texts: (TextNode | ElementNode)[]; elements?: undefined }
	| { elements: ElementNode[]; texts?: undefined }
export type NodesWithType = NodesWithTypeFiltered | null

export type ProcessBlockPaste = (
	element: HTMLElement,
	next: (children: NodeList | Node[], cumulativeTextAttrs: TextAttrs) => Children,
	cumulativeTextAttrs: TextAttrs,
) => ElementNode[] | ElementNode | null

export type ProcessInlinePaste = (
	element: HTMLElement,
	next: (children: NodeList, cumulativeTextAttrs: TextAttrs) => Children,
	cumulativeTextAttrs: TextAttrs,
) => (ElementNode | TextNode)[] | ElementNode | TextNode | null

export type ProcessAttributesPaste = (element: HTMLElement, cumulativeTextAttrs: TextAttrs) => TextAttrs

export type ProcessNodeListPaste = (nodeList: Node[], cumulativeTextAttrs: TextAttrs) => NodesWithType

export interface WithPaste {
	// Main extension points
	processBlockPaste: ProcessBlockPaste
	processInlinePaste: ProcessInlinePaste
	processAttributesPaste: ProcessAttributesPaste
	processNodeListPaste: ProcessNodeListPaste

	// Base implementation
	deserializeFromNodeListToPure: (list: Node[], cumulativeTextAttrs: TextAttrs) => (TextNode | ElementNode)[]
	processWithAttributeProcessor: (element: Node, cta: TextAttrs) => TextAttrs
	deserializeTextNode: (node: Node, cumulativeTextAttrs: TextAttrs) => (TextNode | ElementNode)[] | null
	deserializeTextFromNodeList: (list: NodeList, cumulativeTextAttrs: TextAttrs) => (TextNode | ElementNode)[]

	// Utils
	wordPasteListItemContent: (allNodes: Iterable<Node> | ArrayLike<Node>) => Node[]
	flattenNodesWithType: (withType: NodesWithType[]) => NodesWithType
}

const ignoredElements = ['SCRIPT', 'STYLE', 'TEMPLATE']

export const withPaste: <E extends EditorNode>(
	editor: WithEssentials<E> & EditorNode,
) => asserts editor is WithPaste & WithEssentials<E> & EditorNode = editor => {
	const editorWithEssentials = editor as WithPaste & WithEssentials<EditorNode> & EditorNode
	const { insertData } = editorWithEssentials

	const impl: WithPaste & Partial<EditorNode> = {
		// Base paste
		processWithAttributeProcessor: (element, cta) => {
			if (!(element instanceof HTMLElement)) {
				return {}
			}
			return editorWithEssentials.processAttributesPaste(element, cta)
		},

		processBlockPaste: (element, next, cumulativeTextAttrs) => {
			if (ignoredElements.includes(element.tagName)) {
				return []
			}
			return null
		},
		processInlinePaste: (element, next, cumulativeTextAttrs) => {
			if (ignoredElements.includes(element.tagName)) {
				return []
			}
			if (element.tagName === 'BR') {
				return { ...cumulativeTextAttrs, text: ' ' }
			}
			return null
		},
		processAttributesPaste: (el, cta) => cta,
		processNodeListPaste: (nodeList, cta) => {
			const processed: (
				| { text: TextNode | ElementNode; element?: undefined; isWhiteSpace: boolean }
				| { element: ElementNode; text?: undefined }
			)[] = []

			for (const childNode of nodeList) {
				const isWhiteSpace = childNode.nodeType === Node.TEXT_NODE && childNode.textContent?.match(/^\s*$/) !== null

				// Block
				const attrs = editorWithEssentials.processWithAttributeProcessor(childNode, cta)
				const result =
					childNode instanceof HTMLElement
						? editorWithEssentials.processBlockPaste(
								childNode,
								(list, cta) =>
									editorWithEssentials.deserializeFromNodeListToPure(Array.from(list), { ...attrs, ...cta }),
								cta,
						  )
						: null
				if (result !== null) {
					processed.push(...(Array.isArray(result) ? result : [result]).map(element => ({ element })))
				} else {
					// Inline
					const result = editorWithEssentials.deserializeTextNode(childNode, cta)
					if (result !== null) {
						processed.push(...result.map(text => ({ text, isWhiteSpace })))
					} else {
						// Unknown element
						const deserializedChildren = editorWithEssentials.processNodeListPaste(
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
						if (item.element === undefined) {
							return item.isWhiteSpace ? [] : [editorWithEssentials.createDefaultElement([item.text])]
						} else {
							return [item.element]
						}
					}),
				}
			} else {
				return { texts: processed.map(item => item.text as TextNode) }
			}
		},

		deserializeTextNode: (node, cumulativeTextAttrs) => {
			if (node.nodeType === Node.TEXT_NODE) {
				const text = node.textContent ?? ''
				return [{ ...cumulativeTextAttrs, text: text.replace(/( +\n+ *|\n+ +|\n+)/g, ' ') }]
			} else if (node instanceof HTMLElement) {
				const result = editorWithEssentials.processInlinePaste(
					node,
					(list, cta) => {
						const attrs = editorWithEssentials.processWithAttributeProcessor(node, cta)
						return editorWithEssentials.deserializeTextFromNodeList(list, attrs)
					},
					cumulativeTextAttrs,
				)
				if (result !== null) {
					return Array.isArray(result) ? result : [result]
				}
			}

			return null
		},

		deserializeTextFromNodeList: (list, cumulativeTextAttrs) => {
			return Array.from(list).flatMap(childNode => {
				const result = editorWithEssentials.deserializeTextNode(childNode, cumulativeTextAttrs)
				if (result !== null) {
					return result
				} else {
					const attrs = editorWithEssentials.processWithAttributeProcessor(childNode, cumulativeTextAttrs)
					return editorWithEssentials.deserializeTextFromNodeList(childNode.childNodes, attrs)
				}
			})
		},

		deserializeFromNodeListToPure: (list, cumulativeTextAttrs) => {
			const result = editorWithEssentials.processNodeListPaste(list, cumulativeTextAttrs)
			return result?.texts ?? result?.elements ?? []
		},

		flattenNodesWithType: (withType: NodesWithType[]) => {
			const withTypeFiltered = withType.filter((item): item is Exclude<NodesWithType, null> => item !== null)
			const containsBlock = withTypeFiltered.find(({ elements }) => elements !== undefined) !== undefined

			if (containsBlock) {
				return {
					elements: withTypeFiltered.flatMap<ElementNode>(item => {
						if (item.elements === undefined) {
							return [editorWithEssentials.createDefaultElement(item.texts)]
						} else {
							return item.elements
						}
					}),
				}
			} else {
				return { texts: withTypeFiltered.flatMap(item => item.texts!) }
			}
		},

		insertData: data => {
			const fragment = data.getData('application/x-slate-fragment')

			if (fragment) {
				const decoded = decodeURIComponent(window.atob(fragment))
				editor.insertFragment(JSON.parse(decoded))
				return
			}

			const html = data.getData('text/html')

			if (html) {
				const document = new DOMParser().parseFromString(html, 'text/html')
				const nodes = Array.from(document.body.childNodes)
				const result = editorWithEssentials.deserializeFromNodeListToPure(nodes, {})
				Transforms.insertFragment(editorWithEssentials, result)
				return
			} else {
				return insertData(data)
			}
		},

		wordPasteListItemContent: allNodes => {
			const nodes: Node[] = []
			let ignoring = false
			let forProcessing = Array.from(allNodes)
			if (
				(forProcessing.length === 1 && forProcessing[0].nodeName === 'SPAN') ||
				(forProcessing.length === 2 && forProcessing[0].nodeName === 'SPAN' && forProcessing[1].nodeName === 'O:P')
			) {
				forProcessing = Array.from(forProcessing[0].childNodes)
			}

			for (const node of forProcessing) {
				const isStartIgnore = node.nodeType === Node.COMMENT_NODE && node.nodeValue === '[if !supportLists]'
				if (isStartIgnore) {
					ignoring = true
				} else {
					const isEndIgnore = node.nodeType === Node.COMMENT_NODE && node.nodeValue === '[endif]'
					if (isEndIgnore) {
						ignoring = false
					} else {
						if (!ignoring) {
							nodes.push(node)
						}
					}
				}
			}
			return nodes
		},
	}
	Object.assign(editorWithEssentials, impl)
}
