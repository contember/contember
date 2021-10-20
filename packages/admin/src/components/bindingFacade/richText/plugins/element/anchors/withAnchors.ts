import { Editor } from 'slate'
import { isUrl } from './isUrl'
import { AnchorModifications } from './AnchorModifications'
import { anchorElementPlugin } from './AnchorElement'

export const withAnchors = <E extends Editor>(editor: E): E => {
	const {
		insertData,
		insertText,
		processInlinePaste,
	} = editor

	editor.registerElement(anchorElementPlugin)

	editor.insertText = text => {
		if (text && isUrl(text)) {
			AnchorModifications.wrapAnchor(editor, text)
		} else {
			insertText(text)
		}
	}
	editor.insertData = data => {
		const text = data.getData('text/plain')

		if (text && isUrl(text)) {
			AnchorModifications.wrapAnchor(editor, text)
		} else {
			insertData(data)
		}
	}

	editor.processInlinePaste = (element, next, cumulativeTextAttrs) => {
		if (element.tagName === 'A' && element.getAttribute('href')) {
			const href = element.getAttribute('href')

			return [
				{
					type: 'anchor',
					href,
					children: next(element.childNodes, cumulativeTextAttrs),
				},
			]
		}
		return processInlinePaste(element, next, cumulativeTextAttrs)
	}

	return editor
}
