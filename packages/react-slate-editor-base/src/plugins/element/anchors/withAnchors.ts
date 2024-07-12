import { Editor } from 'slate'
import { AnchorModifications } from './AnchorModifications'
import { AnchorElement, anchorElementPlugin } from './AnchorElement'
import { anchorHtmlDeserializer } from './AnchorHtmlDeserializer'
import { ElementRenderer } from '../../../types'
import { parseUrl } from '../../../internal/utils'

export const withAnchors = ({ render }: { render: ElementRenderer<AnchorElement> }) => <E extends Editor>(editor: E): E => {
	const { insertText } = editor

	editor.registerElement(anchorElementPlugin({ render }))
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
