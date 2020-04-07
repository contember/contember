import { Editor } from 'slate'
import { BaseEditor, TextNode, TextSpecifics } from '../baseEditor'

export const removeMarks = <T extends TextNode, E extends BaseEditor>(editor: E, marks: TextSpecifics<T>) => {
	Editor.withoutNormalizing(editor, () => {
		for (const mark in marks) {
			Editor.removeMark(editor, mark)
		}
	})
}
