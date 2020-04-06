import { RelativeSingleField, RemovalType } from '@contember/binding'
import * as React from 'react'
import { NormalizedBlock } from '../../../blocks'
import { NormalizedFieldBackedElement } from '../FieldBackedElement'
import { BlockEditorElementRenderer } from '../renderers'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideRenderElementOptions {
	discriminationField: RelativeSingleField
	normalizedBlocksRef: React.MutableRefObject<NormalizedBlock[]>
	normalizedLeadingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	//normalizedTrailingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	removalType: RemovalType
}

export const overrideRenderElement = <E extends BlockSlateEditor>(editor: E, options: OverrideRenderElementOptions) => {
	const { renderElement } = editor

	editor.renderElement = props => (
		<BlockEditorElementRenderer
			normalizedBlocks={options.normalizedBlocksRef.current}
			fallbackRenderer={renderElement}
			removalType={options.removalType}
			element={props.element}
			attributes={props.attributes}
			children={props.children}
			discriminationField={options.discriminationField}
		/>
	)
}
