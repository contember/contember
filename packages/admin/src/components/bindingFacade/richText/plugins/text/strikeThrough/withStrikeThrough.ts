import { Editor as SlateEditor } from 'slate'
import { strikeThroughMark, strikeThroughPlugin } from './strikeThroughMark'
import { createMarkHtmlDeserializer } from '../../../baseEditor'


export const withStrikeThrough = <E extends SlateEditor>(editor: E): E => {
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
