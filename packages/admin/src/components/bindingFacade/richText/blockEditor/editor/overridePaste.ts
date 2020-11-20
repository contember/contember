import { BlockSlateEditor } from './BlockSlateEditor'
import { Transforms } from 'slate'
import { ElementNode, TextNode } from '../../baseEditor'
import { PasteProcessor } from './paste/PasteProcessor'
import { mergePastePlugins } from './paste/plugin'


export const overridePaste = <E extends BlockSlateEditor>(editor: E, handlers: any) => {
	const { insertData, defaultElementType } = editor
	const wrapWithDefault = (children: (TextNode | ElementNode)[]): ElementNode => {
		return ({ type: defaultElementType, children: children })
	}

	editor.insertData = data => {
		const html = data.getData('text/html')

		if (html) {
			const document = new DOMParser().parseFromString(html, 'text/html')
			const body = document.body
			const plugins = mergePastePlugins(editor.pastePlugins)
			const pasteProcessor = new PasteProcessor(plugins, wrapWithDefault)
			const result = pasteProcessor.deserializeFromNodeListToPure(body.childNodes)
			console.log(document, result, html)
			Transforms.insertFragment(editor, result)

			return
		} else {
			return insertData(data)
		}
	}
}
