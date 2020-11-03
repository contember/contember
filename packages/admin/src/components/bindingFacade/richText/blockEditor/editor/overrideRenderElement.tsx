import { EntityKeyProvider, FieldValue, RelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { NormalizedBlocks } from '../../../blocks'
import { NormalizedEmbedHandlers } from '../embed/core'
import { FieldBackedElement } from '../FieldBackedElement'
import { BlockEditorElementRenderer } from '../renderers'
import { EditorReferenceBlocks } from '../templating'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideRenderElementOptions {
	editorReferenceBlocks: EditorReferenceBlocks
	referenceDiscriminationField: RelativeSingleField | undefined

	embedContentDiscriminationField: RelativeSingleField | undefined
	embedSubBlocks: NormalizedBlocks | undefined
	embedHandlers: NormalizedEmbedHandlers | undefined
	embedReferenceDiscriminateBy: FieldValue | undefined

	leadingFields: FieldBackedElement[]
	trailingFields: FieldBackedElement[]
}

export const overrideRenderElement = <E extends BlockSlateEditor>(editor: E, options: OverrideRenderElementOptions) => {
	const { renderElement } = editor

	editor.renderElement = props => {
		const child = (
			<BlockEditorElementRenderer
				attributes={props.attributes}
				children={props.children}
				element={props.element}
				fallbackRenderer={renderElement}
				referenceDiscriminationField={options.referenceDiscriminationField}
				editorReferenceBlocks={options.editorReferenceBlocks}
				embedContentDiscriminationField={options.embedContentDiscriminationField}
				embedSubBlocks={options.embedSubBlocks}
				embedHandlers={options.embedHandlers}
				embedReferenceDiscriminateBy={options.embedReferenceDiscriminateBy}
				leadingFields={options.leadingFields}
				trailingFields={options.trailingFields}
			/>
		)

		if ('referenceId' in props.element && props.element.referenceId) {
			return <EntityKeyProvider entityKey={props.element.referenceId}>{child}</EntityKeyProvider>
		}
		return child
	}
}
