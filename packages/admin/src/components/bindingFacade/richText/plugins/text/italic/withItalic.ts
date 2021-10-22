import { Editor as SlateEditor } from 'slate'
import { italicMark, italicMarkPlugin } from './italicMark'


export const withItalic = <E extends SlateEditor>(editor: E): E => {
	const { processAttributesPaste, processInlinePaste } = editor

	editor.registerMark(italicMarkPlugin)

	editor.processAttributesPaste = (element, cta) => {
		if (element.style.fontWeight) {
			const isItalic = ['italic', 'oblique'].includes(element.style.fontWeight)
			cta = { ...cta, [italicMark]: isItalic }
		}
		return processAttributesPaste(element, cta)
	}

	editor.processInlinePaste = (element, next, cumulativeTextAttrs) => {
		if (element.nodeName === 'EM' || element.nodeName === 'I') {
			return next(element.childNodes, { ...cumulativeTextAttrs, [italicMark]: true })
		}
		return processInlinePaste(element, next, cumulativeTextAttrs)
	}

	return editor
}
