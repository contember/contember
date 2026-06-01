import { paragraphElementType } from './ParagraphElement.js'
import { HtmlDeserializerPlugin } from '../../../types/index.js'

export const paragraphHtmlDeserializer: HtmlDeserializerPlugin = {
	processBlockPaste: ({ element, next, cumulativeTextAttrs }) =>
		element.nodeName === 'P'
			? {
				type: paragraphElementType,
				children: next(element.childNodes, cumulativeTextAttrs),
			}
			: null,
}
