import { HandlerNext, NodesWithType, PastePlugin, Processor, TextAttrs } from './plugin'
import { ElementNode, TextNode } from '../../../baseEditor'

function parseWithProcessor<T extends readonly unknown[], R>(
	handlers: Processor<T, R>[],
	next: HandlerNext<T>,
	childNode: HTMLElement,
	cumulativeTextAttrs: TextAttrs,
) {
	let result = undefined
	for (const processor of handlers) {
		result = processor(childNode, next, cumulativeTextAttrs)
		if (result !== undefined) {
			break
		}
	}
	return result
}

export class PasteProcessor {
	constructor(
		private readonly plugins: PastePlugin,
		private readonly wrapWithDefault: (text: (TextNode | ElementNode)[]) => ElementNode,
	) {}

	processWithAttributeProcessor(element: Node): TextAttrs {
		if (!(element instanceof HTMLElement)) {
			return {}
		}
		return Object.assign({}, ...this.plugins.attributeProcessors.map(f => f(element) ?? {}))
	}

	deserializeTextNode(node: Node, cumulativeTextAttrs: TextAttrs): (TextNode | ElementNode)[] | undefined {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent ?? ''
			return [{ ...cumulativeTextAttrs, text: text.replace(/( +\n+ *|\n+ +|\n+)/g, ' ') }]
		} else if (node instanceof HTMLElement) {
			const attrs = this.processWithAttributeProcessor(node)
			const result = parseWithProcessor(
				this.plugins.inlineProcessors,
				(list, cta) => this.deserializeTextFromNodeList(list, { ...cta, ...attrs }),
				node,
				cumulativeTextAttrs,
			)
			if (result !== undefined) {
				return (Array.isArray(result) ? result : [result]).map(text => ({ ...text, ...attrs }))
			}
		}

		return undefined
	}

	deserializeTextFromNodeList(list: NodeList, cumulativeTextAttrs: TextAttrs = {}): (TextNode | ElementNode)[] {
		const processed: (TextNode | ElementNode)[] = []
		for (const childNode of Array.from(list)) {
			const result = this.deserializeTextNode(childNode, cumulativeTextAttrs)
			if (result !== undefined) {
				processed.push(...result)
			} else {
				const attrs = this.processWithAttributeProcessor(childNode)
				processed.push(...this.deserializeTextFromNodeList(childNode.childNodes, { ...cumulativeTextAttrs, ...attrs }))
			}
		}
		return processed
	}

	deserializeFromNodeListToPure(
		list: NodeList | Node[],
		cumulativeTextAttrs: TextAttrs = {},
	): (TextNode | ElementNode)[] {
		const result = this.deserializeFromNodeList(list, cumulativeTextAttrs)
		return result?.texts ?? result?.elements ?? []
	}

	deserializeFromNodeList(nodeList: NodeList | Node[], cumulativeTextAttrs: TextAttrs = {}): NodesWithType {
		const nodes = Array.from(nodeList)

		// Try plugins
		for (let plugin of this.plugins.nodeListProcessors) {
			const result = plugin(nodes, this, cumulativeTextAttrs)
			if (result !== undefined) {
				return result
			}
		}

		const processed: (
			| { text: TextNode | ElementNode; element?: undefined; isWhiteSpace: boolean }
			| { element: ElementNode; text?: undefined }
		)[] = []

		for (const childNode of nodes) {
			const isWhiteSpace = childNode.nodeType === Node.TEXT_NODE && childNode.textContent?.match(/^\s*$/) !== null

			const attrs = this.processWithAttributeProcessor(childNode)

			// Block
			const result =
				childNode instanceof HTMLElement
					? parseWithProcessor(
							this.plugins.blockProcessors,
							(list, cta) => this.deserializeFromNodeListToPure(list, { ...cta, ...attrs }),
							childNode,
							cumulativeTextAttrs,
					  )
					: undefined
			if (result !== undefined) {
				processed.push(...(Array.isArray(result) ? result : [result]).map(element => ({ element })))
			} else {
				// Inline
				const result = this.deserializeTextNode(childNode, cumulativeTextAttrs)
				if (result !== undefined) {
					processed.push(...result.map(text => ({ text, isWhiteSpace })))
				} else {
					// Unknown element
					const deserializedChildren = this.deserializeFromNodeList(childNode.childNodes, {
						...cumulativeTextAttrs,
						...attrs,
					})
					processed.push(
						...(deserializedChildren === undefined
							? []
							: deserializedChildren.texts !== undefined
							? deserializedChildren.texts.map(text => ({ text, isWhiteSpace }))
							: deserializedChildren.elements.map(element => ({ element }))),
					)
				}
			}
		}

		if (processed.length === 0) {
			return undefined
		}

		const containsBlock = processed.find(({ element }) => element !== undefined) !== undefined

		if (containsBlock) {
			return {
				elements: processed.flatMap(item => {
					if (item.element === undefined) {
						return item.isWhiteSpace ? [] : [this.wrapWithDefault([item.text])]
					} else {
						return [item.element]
					}
				}),
			}
		} else {
			return { texts: processed.map(item => item.text as TextNode) }
		}
	}

	flattenNodesWithType(withType: NodesWithType[]): NodesWithType {
		const withTypeFiltered = withType.filter((item): item is Exclude<NodesWithType, undefined> => item !== undefined)
		const containsBlock = withTypeFiltered.find(({ elements }) => elements !== undefined) !== undefined

		if (containsBlock) {
			return {
				elements: withTypeFiltered.flatMap<ElementNode>(item => {
					if (item.elements === undefined) {
						return [this.wrapWithDefault(item.texts)]
					} else {
						return item.elements
					}
				}),
			}
		} else {
			return { texts: withTypeFiltered.flatMap(item => item.texts!) }
		}
	}
}
