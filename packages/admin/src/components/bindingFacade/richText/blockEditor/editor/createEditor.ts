import { createEditorWithEssentials } from '../../baseEditor'
import { paragraphElementType, withAnchors, withBasicFormatting, withHeadings, withParagraphs } from '../../plugins'
import { isContemberBlockElement, isContemberContentPlaceholderElement, isContemberFieldElement } from '../elements'
import { BlockSlateEditor } from './BlockSlateEditor'
import { overrideApply, OverrideApplyOptions } from './overrideApply'
import { overrideDeleteBackward } from './overrideDeleteBackward'
import { overrideInsertBreak } from './overrideInsertBreak'
import { overrideInsertNode } from './overrideInsertNode'
import { overrideIsVoid } from './overrideIsVoid'
import { overrideRenderElement, OverrideRenderElementOptions } from './overrideRenderElement'

export interface CreateEditorOptions extends OverrideApplyOptions, OverrideRenderElementOptions {}

export const createEditor = (options: CreateEditorOptions) => {
	// TODO configurable plugin set
	const editor = withHeadings(
		withParagraphs(withAnchors(withBasicFormatting(createEditorWithEssentials(paragraphElementType)))),
	) as BlockSlateEditor

	const {
		addMark,
		deleteForward,
		deleteFragment,
		insertData,
		insertFragment,
		insertNode,
		insertText,
		normalizeNode,
		redo,
		removeMark,
		undo,
	} = editor

	const { batchUpdates } = options

	editor.isContemberBlockElement = isContemberBlockElement
	editor.isContemberContentPlaceholderElement = isContemberContentPlaceholderElement
	editor.isContemberFieldElement = isContemberFieldElement

	editor.addMark = (key, value) => batchUpdates(() => addMark(key, value))
	editor.deleteForward = unit => batchUpdates(() => deleteForward(unit))
	editor.deleteFragment = () => batchUpdates(() => deleteFragment())
	editor.insertFragment = fragment => batchUpdates(() => insertFragment(fragment))
	editor.insertNode = node => batchUpdates(() => insertNode(node))
	editor.insertText = text => batchUpdates(() => insertText(text))
	editor.normalizeNode = entry => batchUpdates(() => normalizeNode(entry))
	editor.removeMark = key => batchUpdates(() => removeMark(key))

	editor.insertData = data => batchUpdates(() => insertData(data))
	editor.redo = () => batchUpdates(() => redo())
	editor.undo = () => batchUpdates(() => undo())

	overrideIsVoid(editor)

	overrideApply(editor, options)
	overrideDeleteBackward(editor, options)
	overrideInsertBreak(editor, options)
	overrideInsertNode(editor, options)
	overrideRenderElement(editor, options)

	return editor
}
