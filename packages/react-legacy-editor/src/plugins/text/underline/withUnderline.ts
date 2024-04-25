import { Editor as SlateEditor } from 'slate'
import { underlineMark, underlineMarkPlugin } from './underlineMark'
import { createMarkHtmlDeserializer } from '../../../baseEditor'


export const withUnderline = <E extends SlateEditor>(editor: E): E => {
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
