import { describe, expect, it } from 'bun:test'
import { Descendant, Element as SlateElement, Text as SlateText } from 'slate'
import { HtmlDeserializer } from '../../src/plugins/behaviour/paste/HtmlDeserializer'
import { paragraphHtmlDeserializer } from '../../src/plugins/element/paragraphs/ParagraphHtmlDeserializer'

const paragraph = (children: Descendant[]): SlateElement => ({ type: 'paragraph', children } as SlateElement)

const createDeserializer = () => new HtmlDeserializer(
	children => paragraph(children),
	[paragraphHtmlDeserializer],
)

const deserialize = (html: string) => {
	const document = new DOMParser().parseFromString(html, 'text/html')
	return createDeserializer().deserializeBlocks(Array.from(document.body.childNodes), {})
}

const childrenText = (node: unknown): string => {
	if (SlateText.isText(node)) {
		return node.text
	}
	return (node as SlateElement).children.map(childrenText).join('')
}

describe('html deserializer', () => {
	it('trims block boundary whitespace in LibreOffice paste', () => {
		const html = '<p style="line-height: 100%; margin-bottom: 0cm">\nFirst.</p>\n'
			+ '<p style="line-height: 100%; margin-bottom: 0cm"><br>\n\n</p>\n'
			+ '<p style="line-height: 100%; margin-bottom: 0cm">Second.</p>'
		expect(deserialize(html)).toEqual([
			paragraph([{ text: 'First.' }]),
			paragraph([{ text: '' }]),
			paragraph([{ text: 'Second.' }]),
		])
	})

	it('trims leading and trailing whitespace inside a paragraph', () => {
		expect(deserialize('<p>\n\tfoo\n</p>')).toEqual([
			paragraph([{ text: 'foo' }]),
		])
	})

	it('preserves inner whitespace around inline elements', () => {
		const result = deserialize('<p>foo <span>bar</span> baz</p>')
		expect(result).toHaveLength(1)
		expect(childrenText(result[0])).toBe('foo bar baz')
		expect((result[0] as SlateElement).children).toEqual([
			{ text: 'foo ' },
			{ text: 'bar' },
			{ text: ' baz' },
		])
	})

	it('maps <br> to a single space and keeps a lone <br> paragraph', () => {
		const result = deserialize('<p>foo<br>bar</p>')
		expect(result).toHaveLength(1)
		expect(childrenText(result[0])).toBe('foo bar')

		expect(deserialize('<p><br></p>')).toEqual([
			paragraph([{ text: '' }]),
		])
	})

	it('keeps non-breaking space at block edge', () => {
		const result = deserialize('<p>&nbsp;foo</p>')
		expect(result).toHaveLength(1)
		expect(childrenText(result[0])).toBe(' foo')
	})

	it('does not produce extra elements from whitespace between paragraphs', () => {
		const result = deserialize('<p>a</p>\n<p>b</p>')
		expect(result).toHaveLength(2)
		expect(result).toEqual([
			paragraph([{ text: 'a' }]),
			paragraph([{ text: 'b' }]),
		])
	})
})
