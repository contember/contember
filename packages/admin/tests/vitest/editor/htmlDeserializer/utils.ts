import { HtmlDeserializer, HtmlDeserializerPlugin, paragraphElementType } from '../../../../src/'

export const deserializeHtml = (html: string, plugins: HtmlDeserializerPlugin[] = []) => {
	const document = new DOMParser().parseFromString(html, 'text/html')
	const nodes = Array.from(document.body.childNodes)
	const deserializer = new HtmlDeserializer(
		children => ({ type: paragraphElementType, children }),
		plugins,
	)
	return deserializer.deserializeBlocks(nodes, {})
}
