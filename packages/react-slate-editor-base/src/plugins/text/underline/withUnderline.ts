import { underlineMark, underlineMarkPlugin } from './underlineMark.js'
import { createMarkHtmlDeserializer } from '../../behaviour/index.js'
import { EditorPlugin } from '../../../types/index.js'

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
