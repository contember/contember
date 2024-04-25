import { Editor as SlateEditor } from 'slate'
import { boldMark, boldMarkPlugin } from './boldMark'
import { createMarkHtmlDeserializer } from '../../../baseEditor'


export const withBold = <E extends SlateEditor>(editor: E): E => {
	editor.registerMark(boldMarkPlugin)
	editor.htmlDeserializer.registerPlugin(
		createMarkHtmlDeserializer(
			boldMark,
			el => el.nodeName === 'STRONG' || (el.nodeName === 'B' && !el.id.startsWith('docs-internal-guid')),
			el => ['italic', 'oblique'].includes(el.style.fontWeight),
		),
	)

	return editor
}
