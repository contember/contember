import { italicMark, italicMarkPlugin } from './italicMark'
import { EditorPlugin } from '../../../types'
import { createMarkHtmlDeserializer } from '../../behaviour'


export const withItalic = (): EditorPlugin => editor => {
	editor.registerMark(italicMarkPlugin)
	editor.htmlDeserializer.registerPlugin(
		createMarkHtmlDeserializer(
			italicMark,
			el => ['I', 'EM'].includes(el.nodeName),
			el => ['italic', 'oblique'].includes(el.style.fontWeight),
		),
	)
}
