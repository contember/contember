import { paragraphElementType } from './ParagraphElement'
import { HtmlDeserializerPlugin } from '../../../types'

export const paragraphHtmlDeserializer: HtmlDeserializerPlugin = {
	processBlockPaste: ({ element, next, cumulativeTextAttrs }) => element.nodeName === 'P' ? {
		type: paragraphElementType,
		children: next(element.childNodes, cumulativeTextAttrs),
	} : null,
}
