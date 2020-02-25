import {
	createEditorWithEssentials,
	paragraphElementType,
	withAnchors,
	withBasicFormatting,
	withParagraphs,
} from '../../plugins'
import { overrideApply, OverrideApplyOptions } from './overrideApply'
import { overrideDeleteBackward } from './overrideDeleteBackward'
import { overrideInsertNode } from './overrideInsertNode'
import { overrideIsVoid } from './overrideIsVoid'
import { overrideRenderElement, OverrideRenderElementOptions } from './overrideRenderElement'

export interface CreateEditorOptions extends OverrideApplyOptions, OverrideRenderElementOptions {}

export const createEditor = (options: CreateEditorOptions) => {
	// TODO configurable plugin set
	const editor = withParagraphs(withAnchors(withBasicFormatting(createEditorWithEssentials(paragraphElementType))))

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

	const { batchUpdates } = options

	editor.addMark = (key, value) => batchUpdates(() => addMark(key, value))
	editor.deleteForward = unit => batchUpdates(() => deleteForward(unit))
	editor.deleteFragment = () => batchUpdates(() => deleteFragment())
	editor.insertBreak = () => batchUpdates(() => insertBreak())
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
	overrideInsertNode(editor, options)
	overrideRenderElement(editor, options)

	return editor
}
