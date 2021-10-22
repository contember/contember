import { Editor as SlateEditor } from 'slate'
import { boldMarkPlugin } from './boldMark'

export const boldMark = 'isBold'

export const withBold = <E extends SlateEditor>(editor: E): E => {
	const { processAttributesPaste, processInlinePaste } = editor

	editor.registerMark(boldMarkPlugin)


	editor.processAttributesPaste = (element, cta) => {
		if (element.style.fontWeight) {
			const isBold = ['700', '800', '900', 'bold', 'bolder'].includes(element.style.fontWeight)
			cta = { ...cta, [boldMark]: isBold }
		}
		return processAttributesPaste(element, cta)
	}

	editor.processInlinePaste = (element, next, cumulativeTextAttrs) => {
		if (element.nodeName === 'STRONG' || (element.nodeName === 'B' && !element.id.startsWith('docs-internal-guid'))) {
			return next(element.childNodes, { ...cumulativeTextAttrs, [boldMark]: true })
		}
		return processInlinePaste(element, next, cumulativeTextAttrs)
	}

	return editor
}
