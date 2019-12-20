import { RichEditorPluginConfig, simpleHtmlSerializerRule } from './utils'
import * as React from 'react'
import { Editor, RenderMarkProps } from 'slate-react'

export const LINK: RichEditorPluginConfig = {
	node: 'mark',
	type: 'link',
	plugin: {
		renderMark: ({ mark, children, attributes }: RenderMarkProps, editor: Editor, next: () => any) => {
			if (mark.type === 'link') {
				const href = mark.data.get('href')
				return React.createElement(
					'a',
					{ ...attributes, href: href, style: { color: 'blue', textDecoration: 'underline' }, title: href },
					children,
				)
			}
			return next()
		},
	},
	htmlSerializer: simpleHtmlSerializerRule('mark', 'link', 'a', ['href']),
	onToggle: (editor: Editor) => {
		const hasLinks = editor.value.activeMarks.some(mark => mark !== undefined && mark.type === 'link')

		if (hasLinks) {
			editor.removeMark('link')
		} else if (editor.value.selection.isExpanded) {
			const href = window.prompt('Enter the URL of the link:')
			if (href) {
				editor.addMark({
					type: 'link',
					data: { href },
				})
			}
		} else {
			const href = window.prompt('Enter the URL of the link:')
			const text = window.prompt('Enter the text for the link:')

			if (href && text) {
				editor
					.insertText(text)
					.moveFocusBackward(text.length)
					.addMark({
						type: 'link',
						data: { href },
					})
			}
		}

		return editor
	},
}
