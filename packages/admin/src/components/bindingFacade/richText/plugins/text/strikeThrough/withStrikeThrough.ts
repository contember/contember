import { Editor as SlateEditor } from 'slate'
import { strikeThroughMark, strikeThroughPlugin } from './strikeThroughMark'


export const withStrikeThrough = <E extends SlateEditor>(editor: E): E => {
	const {  processAttributesPaste, processInlinePaste } = editor
	editor.registerMark(strikeThroughPlugin)

	editor.processAttributesPaste = (element, cta) => {
		if (element.style.textDecoration) {
			cta = { ...cta, [strikeThroughMark]: element.style.textDecoration === 'line-through' }
		}
		return processAttributesPaste(element, cta)
	}

	editor.processInlinePaste = (element, next, cumulativeTextAttrs) => {
		if (element.nodeName === 'S') {
			return next(element.childNodes, { ...cumulativeTextAttrs, [strikeThroughMark]: true })
		}
		return processInlinePaste(element, next, cumulativeTextAttrs)
	}

	return editor
}
