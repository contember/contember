import { underlineMark, underlineMarkPlugin } from './underlineMark'
import { createMarkHtmlDeserializer } from '../../behaviour'
import { EditorPlugin } from '../../../types'


export const withUnderline = (): EditorPlugin => editor => {
	editor.registerMark(underlineMarkPlugin)
	editor.htmlDeserializer.registerPlugin(
		createMarkHtmlDeserializer(
			underlineMark,
			el => el.nodeName === 'U',
			el => el.style.textDecoration === 'underline',
		),
	)

	return editor
}
