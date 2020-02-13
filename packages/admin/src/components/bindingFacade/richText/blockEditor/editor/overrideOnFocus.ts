import * as React from 'react'
import { Transforms } from 'slate'
import { NormalizedFieldBackedElement } from '../FieldBackedElement'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideOnFocusOptions {
	normalizedLeadingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	normalizedTrailingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
}

export const overrideOnFocus = <E extends BlockSlateEditor>(editor: E, options: OverrideOnFocusOptions) => {
	const { onFocus } = editor

	editor.onFocus = e => {
		if (
			editor.children.length -
				options.normalizedLeadingFieldsRef.current.length -
				options.normalizedTrailingFieldsRef.current.length ===
			0
		) {
			Transforms.insertNodes(
				editor,
				{
					type: 'paragraph',
					children: [{ text: '' }],
				},
				{
					at: [options.normalizedLeadingFieldsRef.current.length],
				},
			)
		}
		// TODO also handle the non-empty case. Find and set_selection to the nearest node.
		onFocus(e)
	}
}
