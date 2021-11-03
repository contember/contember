import { HtmlDeserializerPlugin } from '../../../baseEditor'
import { paragraphElementType } from './ParagraphElement'

export const paragraphHtmlDeserializer: HtmlDeserializerPlugin = {
	processBlockPaste: ({ element, next, cumulativeTextAttrs }) => element.nodeName === 'P' ? {
		type: paragraphElementType,
		children: next(element.childNodes, cumulativeTextAttrs),
	} : null,
}
