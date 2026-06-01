import { Editor as SlateEditor } from 'slate'
import { codeMarkPlugin } from './codeMark.js'
import { EditorPlugin } from '../../../types/index.js'

export const withCode = (): EditorPlugin => editor => {
	editor.registerMark(codeMarkPlugin)

	return editor
}
