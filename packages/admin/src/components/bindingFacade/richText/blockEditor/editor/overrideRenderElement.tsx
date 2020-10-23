import { FieldValue, RelativeSingleField, RemovalType } from '@contember/binding'
import * as React from 'react'
import { NormalizedBlocks } from '../../../blocks'
import { NormalizedEmbedHandlers } from '../embed/core'
import { NormalizedFieldBackedElement } from '../FieldBackedElement'
import { BlockEditorElementRenderer } from '../renderers'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideRenderElementOptions {
	//normalizedTrailingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	normalizedLeadingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	normalizedReferenceBlocksRef: React.MutableRefObject<NormalizedBlocks>
	referenceDiscriminationField: RelativeSingleField | undefined

	embedContentDiscriminationField: RelativeSingleField | undefined
	embedSubBlocks: NormalizedBlocks | undefined
	embedHandlers: NormalizedEmbedHandlers | undefined
	embedReferenceDiscriminateBy: FieldValue | undefined
}

export const overrideRenderElement = <E extends BlockSlateEditor>(editor: E, options: OverrideRenderElementOptions) => {
	const { renderElement } = editor

	editor.renderElement = props => (
		<BlockEditorElementRenderer
			attributes={props.attributes}
			children={props.children}
			element={props.element}
			fallbackRenderer={renderElement}
			normalizedReferenceBlocks={options.normalizedReferenceBlocksRef.current}
			referenceDiscriminationField={options.referenceDiscriminationField}
			embedContentDiscriminationField={options.embedContentDiscriminationField}
			embedSubBlocks={options.embedSubBlocks}
			embedHandlers={options.embedHandlers}
			embedReferenceDiscriminateBy={options.embedReferenceDiscriminateBy}
		/>
	)
}
