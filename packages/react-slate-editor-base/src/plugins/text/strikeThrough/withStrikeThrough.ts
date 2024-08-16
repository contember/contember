import { Editor as SlateEditor } from 'slate'
import { strikeThroughMark, strikeThroughPlugin } from './strikeThroughMark'
import { EditorPlugin } from '../../../types'
import { createMarkHtmlDeserializer } from '../../behaviour'


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
