import { EntityAccessor, EntityListAccessor } from '@contember/binding'
import { BaseEditor } from '../baseEditor'
import * as React from 'react'

export type BatchUpdatesRef = React.MutableRefObject<
	EntityAccessor['batchUpdates'] | EntityListAccessor['batchUpdates']
>

export const withBatching = <E extends BaseEditor>(editor: E, batchUpdatesRef: BatchUpdatesRef): E => {
	const {
		addMark,
		apply,
		deleteBackward,
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
		toggleElement,
		toggleMarks,
		undo,
	} = editor

	editor.addMark = (key, value) => batchUpdatesRef.current(() => addMark(key, value))
	editor.apply = operation => batchUpdatesRef.current(() => apply(operation))
	editor.deleteBackward = unit => batchUpdatesRef.current(() => deleteBackward(unit))
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

	editor.toggleElement = (elementType, suchThat) => batchUpdatesRef.current(() => toggleElement(elementType, suchThat))
	editor.toggleMarks = marks => batchUpdatesRef.current(() => toggleMarks(marks))

	return editor
}
