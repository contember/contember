import { Editor as SlateEditor } from 'slate'
import { underlineMark, underlineMarkPlugin } from './underlineMark'


export const withUnderline = <E extends SlateEditor>(editor: E): E => {
	const {  processAttributesPaste, processInlinePaste } = editor

	editor.registerMark(underlineMarkPlugin)

	editor.processAttributesPaste = (element, cta) => {
		if (element.style.textDecoration) {
			cta = { ...cta, [underlineMark]: element.style.textDecoration === 'underline' }
		}
		return processAttributesPaste(element, cta)
	}

	editor.processInlinePaste = (element, next, cumulativeTextAttrs) => {
		if (element.nodeName === 'U') {
			return next(element.childNodes, { ...cumulativeTextAttrs, [underlineMark]: true })
		}
		return processInlinePaste(element, next, cumulativeTextAttrs)
	}

	return editor
}
