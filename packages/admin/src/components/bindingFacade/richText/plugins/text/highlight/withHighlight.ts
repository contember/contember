import { Editor as SlateEditor } from 'slate'
import { highlightMarkPlugin } from './highlightMark'


export const withHighlight = <E extends SlateEditor>(editor: E): E => {
	editor.registerMark(highlightMarkPlugin)

	return editor
}
