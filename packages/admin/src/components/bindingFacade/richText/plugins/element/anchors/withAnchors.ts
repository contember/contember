import { Editor } from 'slate'
import { AnchorModifications } from './AnchorModifications'
import { anchorElementPlugin } from './AnchorElement'
import { anchorHtmlDeserializer } from './AnchorHtmlDeserializer'
import { parseUrl } from '../../../utils'

export const withAnchors = <E extends Editor>(editor: E): E => {
	const { insertText } = editor

	editor.registerElement(anchorElementPlugin)
	editor.htmlDeserializer.registerPlugin(anchorHtmlDeserializer)

	editor.insertText = text => {
		if (text && parseUrl(text) !== undefined) {
			AnchorModifications.wrapAnchor(editor, text)
		} else {
			insertText(text)
		}
	}

	return editor
}
