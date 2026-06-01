import { boldMark, boldMarkPlugin } from './boldMark.js'
import { EditorPlugin } from '../../../types/index.js'
import { createMarkHtmlDeserializer } from '../../behaviour/index.js'

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
