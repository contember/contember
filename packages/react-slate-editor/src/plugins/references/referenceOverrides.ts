import { Descendant, Editor, Element, Element as SlateElement, Node as SlateNode, Path as SlatePath, Text, Transforms } from 'slate'
import { isInReferenceElement, prepareElementForInsertion } from './utils'
import { ContemberEditor, EditorTransforms } from '@contember/react-slate-editor-base'
import { isElementWithReference } from './elements'

export const referenceOverrides = (editor: Editor) => {
	let { insertData, insertFragment, insertBreak, insertNode } = editor

	const stripNodeReferences = (nodes: SlateNode[]): SlateNode[] =>
		nodes.flatMap(node => {
			if (Text.isText(node)) {
				return node as SlateNode
			}
			if (SlateElement.isElement(node) && 'referenceId' in node) {
				// Essentially unwrapping the node.
				return stripNodeReferences((node as SlateElement).children)
			}
			return {
				...node,
				children: stripNodeReferences(node.children),
			} as Descendant
		})

	editor.insertFragment = fragment => {
		insertFragment(stripNodeReferences(fragment))
	}

	editor.insertData = data => {
		if (editor.selection && isInReferenceElement(editor)) {
			const text = data.getData('text/plain').trim()
			EditorTransforms.insertText(editor, text)
			return // No splitting of references. We'd have to clone the reference and we don't know how to do that yet.
		}
		return insertData(data)
	}

	editor.insertBreak = () => {
		const closestBlockEntry = ContemberEditor.closestBlockEntry(editor)
		if (closestBlockEntry && isElementWithReference(closestBlockEntry[0])) {
			const selection = editor.selection
			const [, closestBlockPath] = closestBlockEntry
			const [referenceStart, referenceEnd] = Editor.edges(editor, closestBlockPath)

			if (!selection) {
				return
			}

			return Editor.withoutNormalizing(editor, () => {
				Transforms.wrapNodes(editor, editor.createDefaultElement([]), {
					at: {
						anchor: referenceStart,
						focus: referenceEnd,
					},
					match: node => Text.isText(node) || (Element.isElement(node) && editor.isInline(node)),
				})

				const relative = SlatePath.relative(selection.focus.path, closestBlockPath)
				Transforms.splitNodes(editor, {
					// The zero should be the newly created default element.
					at: {
						path: [...closestBlockPath, 0, ...relative],
						offset: selection.focus.offset,
					},
					always: true,
				})
			})
		}

		// Do not split reference nodes
		if (isInReferenceElement(editor)) {
			return
		}

		return insertBreak()
	}

	editor.insertNode = node => {
		if (!SlateElement.isElement(node)) {
			return insertNode(node)
		}
		Editor.withoutNormalizing(editor, () => {
			const preppedPath = prepareElementForInsertion(editor, isElementWithReference(node))
			Transforms.insertNodes(editor, node, {
				at: preppedPath,
			})
		})
	}
}
