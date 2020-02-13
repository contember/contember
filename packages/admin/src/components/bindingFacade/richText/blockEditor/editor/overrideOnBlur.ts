import * as React from 'react'
import { Element, Node as SlateNode, Transforms } from 'slate'
import { NormalizedFieldBackedElement } from '../FieldBackedElement'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideOnBlurOptions {
	normalizedLeadingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	normalizedTrailingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
}

export const overrideOnBlur = <E extends BlockSlateEditor>(editor: E, options: OverrideOnBlurOptions) => {
	const { onBlur } = editor

	editor.onBlur = e => {
		if (
			editor.children.length -
				options.normalizedLeadingFieldsRef.current.length -
				options.normalizedTrailingFieldsRef.current.length ===
			1
		) {
			const firstContentIndex = options.normalizedLeadingFieldsRef.current.length
			const soleElement = editor.children[firstContentIndex] as Element
			if (editor.isParagraph(soleElement) && soleElement.children.length === 1) {
				if (SlateNode.string(soleElement) === '') {
					Transforms.removeNodes(editor, {
						at: [firstContentIndex],
					})
				}
			}
		}
		onBlur(e)
	}
}
