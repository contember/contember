import { Editor } from 'slate'
import { isUrl } from './isUrl'
import { AnchorModifications } from './AnchorModifications'
import { anchorElementPlugin } from './AnchorElement'
import { anchorHtmlDeserializer } from './AnchorHtmlDeserializer'

export const withAnchors = <E extends Editor>(editor: E): E => {
	const { insertText } = editor

	editor.registerElement(anchorElementPlugin)
	editor.htmlDeserializer.registerPlugin(anchorHtmlDeserializer)

	editor.insertText = text => {
		if (text && isUrl(text)) {
			AnchorModifications.wrapAnchor(editor, text)
		} else {
			insertText(text)
		}
	}

	return editor
}
