import { Editor as SlateEditor, Transforms } from 'slate'

export const withNewline = <E extends SlateEditor>(editor: E): E => {
	const { onKeyDown } = editor

	Object.assign<E, Partial<SlateEditor>>(editor, {
		onKeyDown: e => {
			if (e.key !== 'Enter' || !e.shiftKey) {
				return onKeyDown(e)
			}
			e.preventDefault()
			Transforms.insertText(editor, '\n')
		},
	})

	return editor
}
