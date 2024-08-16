import { Editor as SlateEditor } from 'slate'
import { codeMarkPlugin } from './codeMark'
import { EditorPlugin } from '../../../types'


export const withCode = (): EditorPlugin => editor => {
	editor.registerMark(codeMarkPlugin)

	return editor
}
