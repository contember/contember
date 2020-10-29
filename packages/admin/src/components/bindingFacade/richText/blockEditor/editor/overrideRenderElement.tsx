import { EntityKeyProvider, FieldValue, RelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { NormalizedBlocks } from '../../../blocks'
import { NormalizedEmbedHandlers } from '../embed/core'
import { FieldBackedElement } from '../FieldBackedElement'
import { BlockEditorElementRenderer } from '../renderers'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideRenderElementOptions {
	//normalizedTrailingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	normalizedReferenceBlocksRef: React.MutableRefObject<NormalizedBlocks>
	referenceDiscriminationField: RelativeSingleField | undefined

	embedContentDiscriminationField: RelativeSingleField | undefined
	embedSubBlocks: NormalizedBlocks | undefined
	embedHandlers: NormalizedEmbedHandlers | undefined
	embedReferenceDiscriminateBy: FieldValue | undefined
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
				normalizedReferenceBlocks={options.normalizedReferenceBlocksRef.current}
				referenceDiscriminationField={options.referenceDiscriminationField}
				embedContentDiscriminationField={options.embedContentDiscriminationField}
				embedSubBlocks={options.embedSubBlocks}
				embedHandlers={options.embedHandlers}
				embedReferenceDiscriminateBy={options.embedReferenceDiscriminateBy}
			/>
		)

		if ('referenceId' in props.element && props.element.referenceId) {
			return <EntityKeyProvider entityKey={props.element.referenceId}>{child}</EntityKeyProvider>
		}
		return child
	}
}
