import {
	AccessorProvider,
	EntityAccessor,
	FieldValue,
	RelativeEntityList,
	RelativeSingleField,
} from '@contember/binding'
import type { MutableRefObject } from 'react'
import type { NormalizedBlocks } from '../../../blocks'
import { isElementWithReference } from '../elements'
import type { NormalizedEmbedHandlers } from '../embed'
import type { FieldBackedElement } from '../FieldBackedElement'
import { BlockEditorElementRenderer } from '../renderers'
import type { EditorReferenceBlocks } from '../templating'
import type { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideRenderElementOptions {
	editorReferenceBlocks: EditorReferenceBlocks
	referenceDiscriminationField: RelativeSingleField | undefined
	getParentEntityRef: MutableRefObject<EntityAccessor.GetEntityAccessor>
	desugaredBlockList: RelativeEntityList

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
				getParentEntityRef={options.getParentEntityRef}
				desugaredBlockList={options.desugaredBlockList}
				editorReferenceBlocks={options.editorReferenceBlocks}
				embedContentDiscriminationField={options.embedContentDiscriminationField}
				embedSubBlocks={options.embedSubBlocks}
				embedHandlers={options.embedHandlers}
				embedReferenceDiscriminateBy={options.embedReferenceDiscriminateBy}
				leadingFields={options.leadingFields}
				trailingFields={options.trailingFields}
			/>
		)

		if (isElementWithReference(props.element)) {
			return <AccessorProvider accessor={editor.getReferencedEntity(props.element)}>{child}</AccessorProvider>
		}
		return child
	}
}
