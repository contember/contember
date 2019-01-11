import { Editor, Value } from 'slate'
import { RichEditorPluginConfig, simpleMarkPlugin, simpleMarkRule } from './utils'

const LINK: RichEditorPluginConfig = {
	node: 'mark',
	type: 'link',
	plugin: simpleMarkPlugin('link', 'a', ['href']),
	htmlSerializer: simpleMarkRule('link', 'a', ['href']),
	onToggle: (editor: Editor) => {
		const hasLinks = editor.value.activeMarks.some(mark => mark !== undefined && mark.type == 'link')
		// const change = value.

		if (hasLinks) {
			// value.
			editor.removeMark('link')
		} else if (editor.value.selection.isExpanded) {
			const href = window.prompt('Enter the URL of the link:')
			if (href) {
				editor.addMark({
					type: 'link',
					data: { href }
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
						data: { href }
					})
			}
		}

		return editor
	}
}

export default LINK
