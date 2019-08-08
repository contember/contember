import { getEventTransfer, Plugins } from 'slate-react'
import { Document } from 'slate'
import HtmlSerializer from 'slate-html-serializer'
import { TEXT_HTML_RULE } from '../configs/html'
import { WithHtmlSerializer } from './types'

export function createPastePlugin(defs: WithHtmlSerializer[]): Plugins {
	const htmlSerializer = new HtmlSerializer({
		rules: [...defs.flatMap(def => Object.values(def).map(c => c.htmlSerializer)), TEXT_HTML_RULE]
	})

	return [
		{
			onPaste: (event, editor, next) => {
				const transfer = getEventTransfer(event)
				if (transfer.type !== 'html') return next()
				const { document } = htmlSerializer.deserialize(((transfer as unknown) as { html: string }).html)
				const nodes = document.nodes.filter(block => block != undefined && block.text.length > 0).toList()
				editor.insertFragment(Document.create(nodes))
			}
		}
	]
}
