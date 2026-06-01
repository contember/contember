import { Editor } from 'slate'
import { AnchorModifications } from './AnchorModifications.js'
import { AnchorElement, anchorElementPlugin } from './AnchorElement.js'
import { anchorHtmlDeserializer } from './AnchorHtmlDeserializer.js'
import { ElementRenderer } from '../../../types/index.js'
import { parseUrl } from '../../../internal/utils/index.js'

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
