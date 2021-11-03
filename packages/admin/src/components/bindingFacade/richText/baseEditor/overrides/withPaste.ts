import { Editor as SlateEditor, Transforms } from 'slate'
import { HtmlDeserializer } from '../html'

const ignoredElements = ['SCRIPT', 'STYLE', 'TEMPLATE']

export const withPaste: <E extends SlateEditor>(
	editor: E,
) => asserts editor is E = editor => {
	const { insertData } = editor
	const htmlDeserializer = new HtmlDeserializer(editor.createDefaultElement, [])
	editor.htmlDeserializer = htmlDeserializer
	editor.insertData = data => {
		if (data.getData('application/x-slate-fragment')) {
			return insertData(data)
		}
		const html = data.getData('text/html')
		if (!html) {
			return insertData(data)
		}
		const document = new DOMParser().parseFromString(html, 'text/html')
		const nodes = Array.from(document.body.childNodes)
		const result = htmlDeserializer.deserializeBlocks(nodes, {})
		Transforms.insertFragment(editor, result)
	}
}
