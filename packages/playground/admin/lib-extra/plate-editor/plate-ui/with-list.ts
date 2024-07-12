import { HotkeyPlugin, PlateEditor, Value, WithPlatePlugin } from '@udecode/plate-common'
import {
	deleteBackwardList,
	deleteForwardList,
	deleteFragmentList,
	insertBreakList,
	insertFragmentList, normalizeList,
} from '@udecode/plate-list'

interface ListPlugin extends HotkeyPlugin {
	/**
	 * Valid children types for list items, in addition to p and ul types.
	 */
	validLiChildrenTypes?: string[]
	enableResetOnShiftTab?: boolean
}

export interface TodoListPlugin extends HotkeyPlugin {
	inheritCheckStateOnLineStartBreak?: boolean
	inheritCheckStateOnLineEndBreak?: boolean
}

export const withList = <
	V extends Value = Value,
	E extends PlateEditor<V> = PlateEditor<V>,
>(
	editor: E,
	{ options: { validLiChildrenTypes } }: WithPlatePlugin<ListPlugin, V, E>,
) => {
	const { insertBreak, deleteBackward, deleteForward, deleteFragment } = editor

	editor.insertBreak = () => {
		if (insertBreakList(editor)) return

		insertBreak()
	}

	editor.deleteBackward = unit => {
		if (deleteBackwardList(editor, unit)) return

		deleteBackward(unit)
	}

	editor.deleteForward = unit => {
		if (deleteForwardList(editor, deleteForward, unit)) return

		deleteForward(unit)
	}

	editor.deleteFragment = direction => {
		if (deleteFragmentList(editor)) return

		deleteFragment(direction)
	}

	editor.insertFragment = insertFragmentList(editor)

	editor.normalizeNode = normalizeList(editor, { validLiChildrenTypes })

	return editor
}
