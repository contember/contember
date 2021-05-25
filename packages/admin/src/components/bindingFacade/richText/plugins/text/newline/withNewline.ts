import { Transforms } from 'slate'
import type { BaseEditor } from '../../../baseEditor'

export const withNewline = <E extends BaseEditor>(editor: E): E => {
	const { onKeyDown } = editor

	Object.assign<E, Partial<BaseEditor>>(editor, {
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
