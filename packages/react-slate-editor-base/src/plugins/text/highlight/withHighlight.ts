import { Editor as SlateEditor } from 'slate'
import { highlightMarkPlugin } from './highlightMark.js'
import { EditorPlugin } from '../../../types/index.js'

export const withHighlight = (): EditorPlugin => editor => {
	editor.registerMark(highlightMarkPlugin)

	return editor
}
