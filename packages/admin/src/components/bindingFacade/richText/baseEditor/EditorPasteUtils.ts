import { Element } from 'slate'
import { NodesWithType } from './html'
import { EditorDefaultElementFactory } from './EditorWithEssentials'

export class EditorPasteUtils {
		public static wordPasteListItemContent(allNodes: Iterable<Node> | ArrayLike<Node>): Node[] {
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
		}

		public static flattenNodesWithType(withType: NodesWithType[], defaultElementFactory: EditorDefaultElementFactory): NodesWithType  {
			const withTypeFiltered = withType.filter((item): item is Exclude<NodesWithType, null> => item !== null)
			const containsBlock = withTypeFiltered.find(({ elements }) => elements !== undefined) !== undefined

			if (containsBlock) {
				return {
					elements: withTypeFiltered.flatMap<Element>(item => {
						if (item.elements === undefined) {
							return [defaultElementFactory(item.texts)]
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
