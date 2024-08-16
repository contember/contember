import { Editor, Transforms } from 'slate'
import { EditorPlugin } from '../../../types/plugins'
import { HtmlDeserializer } from './HtmlDeserializer'
import { HtmlDeserializerPlugin } from '../../../types/htmlDeserializer'


export const withPaste = (editor: Editor) => {
	const { insertData } = editor
	const htmlDeserializer = new HtmlDeserializer(editor.createDefaultElement, [])
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
	editor.htmlDeserializer = htmlDeserializer
}
