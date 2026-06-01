import { italicMark, italicMarkPlugin } from './italicMark.js'
import { EditorPlugin } from '../../../types/index.js'
import { createMarkHtmlDeserializer } from '../../behaviour/index.js'

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
