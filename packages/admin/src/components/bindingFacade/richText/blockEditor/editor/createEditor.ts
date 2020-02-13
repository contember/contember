import * as React from 'react'
import { createEditorWithEssentials, withAnchors, withBasicFormatting, withParagraphs } from '../../plugins'
import { overrideApply, OverrideApplyOptions } from './overrideApply'
import { overrideInsertNode } from './overrideInsertNode'
import { overrideIsVoid } from './overrideIsVoid'
import { overrideOnBlur, OverrideOnBlurOptions } from './overrideOnBlur'
import { overrideOnFocus, OverrideOnFocusOptions } from './overrideOnFocus'
import { overrideRenderElement, OverrideRenderElementOptions } from './overrideRenderElement'

export interface CreateEditorOptions
	extends OverrideApplyOptions,
		OverrideRenderElementOptions,
		OverrideOnFocusOptions,
		OverrideOnBlurOptions {}

export const createEditor = (options: CreateEditorOptions) => {
	// TODO configurable plugin set
	const editor = withParagraphs(withAnchors(withBasicFormatting(createEditorWithEssentials())))

	const {
		addMark,
		deleteBackward,
		deleteForward,
		deleteFragment,
		insertBreak,
		insertData,
		insertFragment,
		insertNode,
		insertText,
		redo,
		removeMark,
		undo,
	} = editor

	const { batchUpdates } = options

	editor.addMark = (key, value) => batchUpdates(() => addMark(key, value))
	editor.deleteBackward = unit => batchUpdates(() => deleteBackward(unit))
	editor.deleteForward = unit => batchUpdates(() => deleteForward(unit))
	editor.deleteFragment = () => batchUpdates(() => deleteFragment())
	editor.insertBreak = () => batchUpdates(() => insertBreak())
	editor.insertFragment = fragment => batchUpdates(() => insertFragment(fragment))
	editor.insertNode = node => batchUpdates(() => insertNode(node))
	editor.insertText = text => batchUpdates(() => insertText(text))
	editor.removeMark = key => batchUpdates(() => removeMark(key))

	editor.insertData = data => batchUpdates(() => insertData(data))
	editor.redo = () => batchUpdates(() => redo())
	editor.undo = () => batchUpdates(() => undo())

	overrideIsVoid(editor)
	overrideInsertNode(editor)

	overrideApply(editor, options)
	overrideRenderElement(editor, options)
	overrideOnFocus(editor, options)
	overrideOnBlur(editor, options)

	return editor
}
