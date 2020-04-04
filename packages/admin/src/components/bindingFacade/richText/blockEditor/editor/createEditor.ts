import { createEditorWithEssentials } from '../../baseEditor'
import { paragraphElementType, withAnchors, withBasicFormatting, withHeadings, withParagraphs } from '../../plugins'
import { isContemberBlockElement, isContemberContentPlaceholderElement, isContemberFieldElement } from '../elements'
import { BlockSlateEditor } from './BlockSlateEditor'
import { overrideApply, OverrideApplyOptions } from './overrideApply'
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
		insertBreak,
		insertData,
		insertFragment,
		insertNode,
		insertText,
		normalizeNode,
		redo,
		removeMark,
		undo,
	} = editor

	const { batchUpdatesRef } = options

	editor.isContemberBlockElement = isContemberBlockElement
	editor.isContemberContentPlaceholderElement = isContemberContentPlaceholderElement
	editor.isContemberFieldElement = isContemberFieldElement

	editor.addMark = (key, value) => batchUpdatesRef.current(() => addMark(key, value))
	editor.deleteForward = unit => batchUpdatesRef.current(() => deleteForward(unit))
	editor.deleteFragment = () => batchUpdatesRef.current(() => deleteFragment())
	editor.insertFragment = fragment => batchUpdatesRef.current(() => insertFragment(fragment))
	editor.insertNode = node => batchUpdatesRef.current(() => insertNode(node))
	editor.insertText = text => batchUpdatesRef.current(() => insertText(text))
	editor.insertBreak = () => batchUpdatesRef.current(() => insertBreak())
	editor.normalizeNode = entry => batchUpdatesRef.current(() => normalizeNode(entry))
	editor.removeMark = key => batchUpdatesRef.current(() => removeMark(key))

	editor.insertData = data => batchUpdatesRef.current(() => insertData(data))
	editor.redo = () => batchUpdatesRef.current(() => redo())
	editor.undo = () => batchUpdatesRef.current(() => undo())

	overrideIsVoid(editor)

	overrideApply(editor, options)
	overrideRenderElement(editor, options)
	overrideInsertNode(editor)

	return editor
}
