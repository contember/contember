import { describe, expect, it } from 'bun:test'
import { Descendant, Editor, Element as SlateElement, Node as SlateNode } from 'slate'
import { createEditorWithEssentials } from '../../src/editor/createEditorWithEssentials.js'
import { withLists } from '../../src/plugins/element/lists/withLists.js'

const createListEditor = (children: Descendant[]) => {
	const editor = createEditorWithEssentials({ defaultElementType: 'paragraph' })
	withLists({
		renderListItem: () => null,
		renderOrderedList: () => null,
		renderUnorderedList: () => null,
	})(editor)
	editor.children = children
	return editor
}

const hasEmptyElement = (editor: Editor) => Array.from(SlateNode.elements(editor)).some(([element]) => element.children.length === 0)

describe('empty element normalization', () => {
	it('fills a list item without children instead of throwing', () => {
		const editor = createListEditor([
			{
				type: 'unorderedList',
				children: [
					{ type: 'listItem', children: [{ text: 'first' }] },
					{ type: 'listItem', children: [] },
				],
			} as SlateElement,
		])

		expect(() => Editor.normalize(editor, { force: true })).not.toThrow()
		expect(hasEmptyElement(editor)).toBe(false)
	})
})
