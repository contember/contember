import { Editor as SlateEditor } from 'slate'
import { strikeThroughMark, strikeThroughPlugin } from './strikeThroughMark.js'
import { EditorPlugin } from '../../../types/index.js'
import { createMarkHtmlDeserializer } from '../../behaviour/index.js'

export const withStrikeThrough = (): EditorPlugin => editor => {
	editor.registerMark(strikeThroughPlugin)
	editor.htmlDeserializer.registerPlugin(
		createMarkHtmlDeserializer(
			strikeThroughMark,
			el => el.nodeName === 'S',
			el => el.style.textDecoration === 'line-through',
		),
	)

	return editor
}
