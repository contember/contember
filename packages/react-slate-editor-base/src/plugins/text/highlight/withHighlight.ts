import { Editor as SlateEditor } from 'slate'
import { highlightMarkPlugin } from './highlightMark'
import { EditorPlugin } from '../../../types'


export const withHighlight = (): EditorPlugin => editor => {
	editor.registerMark(highlightMarkPlugin)

	return editor
}
