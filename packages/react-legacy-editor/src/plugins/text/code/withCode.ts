import { Editor as SlateEditor } from 'slate'
import { codeMarkPlugin } from './codeMark'


export const withCode = <E extends SlateEditor>(editor: E): E => {
	editor.registerMark(codeMarkPlugin)

	return editor
}
