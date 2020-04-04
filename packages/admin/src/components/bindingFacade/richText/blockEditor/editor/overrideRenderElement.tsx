import { BindingError, EntityAccessor, EntityListAccessor, RelativeSingleField, RemovalType } from '@contember/binding'
import * as React from 'react'
import { assertNever } from '../../../../../utils'
import { NormalizedBlock } from '../../../blocks'
import { NormalizedFieldBackedElement } from '../FieldBackedElement'
import { BlockEditorElementRenderer } from '../renderers'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideRenderElementOptions {
	discriminationField: RelativeSingleField
	entityListAccessorRef: React.MutableRefObject<EntityListAccessor>
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
			getEntityByKey={key => {
				const entity = options.entityListAccessorRef.current.getByKey(key)
				if (!(entity instanceof EntityAccessor)) {
					throw new BindingError(`Corrupted data.`)
				}
				return entity
			}}
			getNormalizedFieldBackedElement={element => {
				let normalizedElements: NormalizedFieldBackedElement[]
				if (element.position === 'leading') {
					normalizedElements = options.normalizedLeadingFieldsRef.current
				} /*else if (element.position === 'trailing') {
					normalizedElements = options.normalizedTrailingFieldsRef.current
				} */ else {
					return assertNever(element.position)
				}
				return normalizedElements[element.index]
			}}
		/>
	)
}
