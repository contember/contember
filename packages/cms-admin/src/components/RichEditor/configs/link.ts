import { Editor } from 'slate'
import { RichEditorPluginConfig, simpleMarkPlugin, simpleHtmlSerializerRule } from './utils'

export const LINK: RichEditorPluginConfig = {
	node: 'mark',
	type: 'link',
	plugin: simpleMarkPlugin('link', 'a', ['href']),
	htmlSerializer: simpleHtmlSerializerRule('mark', 'link', 'a', ['href']),
	onToggle: (editor: Editor) => {
		const hasLinks = editor.value.activeMarks.some(mark => mark !== undefined && mark.type == 'link')

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
