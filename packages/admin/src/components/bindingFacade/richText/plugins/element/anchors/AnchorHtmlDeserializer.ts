import { HtmlDeserializerPlugin } from '../../../baseEditor'

export const anchorHtmlDeserializer: HtmlDeserializerPlugin  = {
	processInlinePaste: ({ element, next, cumulativeTextAttrs }) => {
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
		return null
	},
}
