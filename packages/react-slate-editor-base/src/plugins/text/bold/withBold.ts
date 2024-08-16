import { boldMark, boldMarkPlugin } from './boldMark'
import { EditorPlugin } from '../../../types'
import { createMarkHtmlDeserializer } from '../../behaviour'


export const withBold = (): EditorPlugin => editor => {
	editor.registerMark(boldMarkPlugin)
	editor.htmlDeserializer.registerPlugin(
		createMarkHtmlDeserializer(
			boldMark,
			el => el.nodeName === 'STRONG' || (el.nodeName === 'B' && !el.id.startsWith('docs-internal-guid')),
			el => ['italic', 'oblique'].includes(el.style.fontWeight),
		),
	)
}
