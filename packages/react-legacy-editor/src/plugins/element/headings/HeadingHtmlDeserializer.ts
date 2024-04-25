import { EditorPasteUtils, HtmlDeserializerPlugin } from '../../../baseEditor'
import { headingElementType } from './HeadingElement'

export const headingHtmlDeserializer: HtmlDeserializerPlugin = {
	processBlockPaste: ({ element, next, cumulativeTextAttrs }) => {
		const match = element.nodeName.match(/^H(?<level>[1-6])$/)
		if (match !== null) {
			const isNumbered = (element.getAttribute('style')?.match(/mso-list:\w+ level\d+ \w+/) ?? null) !== null
			const children = isNumbered ? EditorPasteUtils.wordPasteListItemContent(element.childNodes) : element.childNodes
			return {
				type: headingElementType,
				level: parseInt(match.groups!.level),
				children: next(children, cumulativeTextAttrs),
				isNumbered,
			}
		}
		return null
	},
}
