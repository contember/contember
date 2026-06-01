import { Transforms } from 'slate'
import { EditorPlugin } from '../../../types/index.js'

export const withNewline = (): EditorPlugin => editor => {
	const { onKeyDown } = editor
	editor.onKeyDown = e => {
		if (e.key !== 'Enter' || !e.shiftKey) {
			return onKeyDown(e)
		}
		e.preventDefault()
		Transforms.insertText(editor, '\n')
	}
}
