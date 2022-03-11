import type { EditorWithBlocks } from './EditorWithBlocks'
import { isInReferenceElement } from '../utils'
import { ContemberEditor } from '../../ContemberEditor'
import { isElementWithReference } from '../elements'
import { Editor, Transforms, Text, Element, Path as SlatePath } from 'slate'

export interface OverrideInsertBreakOptions {}

export const overrideInsertBreak = <E extends EditorWithBlocks>(editor: E, options: OverrideInsertBreakOptions) => {
	const { insertBreak } = editor

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
}
