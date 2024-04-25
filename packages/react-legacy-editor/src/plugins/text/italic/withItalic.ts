import { Editor as SlateEditor } from 'slate'
import { italicMark, italicMarkPlugin } from './italicMark'
import { createMarkHtmlDeserializer } from '../../../baseEditor'


export const withItalic = <E extends SlateEditor>(editor: E): E => {
	editor.registerMark(italicMarkPlugin)
	editor.htmlDeserializer.registerPlugin(
		createMarkHtmlDeserializer(
			italicMark,
			el => ['I', 'EM'].includes(el.nodeName),
			el => ['italic', 'oblique'].includes(el.style.fontWeight),
		),
	)

	return editor
}
