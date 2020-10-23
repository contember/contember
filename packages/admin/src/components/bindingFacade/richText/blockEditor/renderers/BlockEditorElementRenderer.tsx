import { BindingError, EntityKeyProvider, FieldValue, RelativeSingleField } from '@contember/binding'
import { EditorPlaceholder } from '@contember/ui'
import * as React from 'react'
import { RenderElementProps } from 'slate-react'
import { NormalizedBlocks } from '../../../blocks'
import { ElementNode } from '../../baseEditor'
import {
	isBlockVoidReferenceElement,
	isContemberContentPlaceholderElement,
	isContemberFieldElement,
	isEmbedElement,
} from '../elements'
import { NormalizedEmbedHandlers } from '../embed/core'
import { BlockVoidReferenceElementRenderer } from './BlockVoidReferenceElementRenderer'
import { BlockEditorGetNormalizedFieldBackedElementContext } from './ContemberElementRefreshContext'
import { ContemberFieldElementRenderer } from './ContemberFieldElementRenderer'
import { EmbedElementRenderer } from './EmbedElementRenderer'

export interface BlockEditorElementRendererProps extends RenderElementProps {
	element: ElementNode
	referenceDiscriminationField: RelativeSingleField | undefined
	normalizedReferenceBlocks: NormalizedBlocks
	fallbackRenderer: (props: RenderElementProps) => React.ReactElement

	embedContentDiscriminationField: RelativeSingleField | undefined
	embedSubBlocks: NormalizedBlocks | undefined
	embedHandlers: NormalizedEmbedHandlers | undefined
	embedReferenceDiscriminateBy: FieldValue | undefined
}

export const BlockEditorElementRenderer = ({
	fallbackRenderer,
	embedContentDiscriminationField,
	embedHandlers,
	embedReferenceDiscriminateBy,
	embedSubBlocks,
	normalizedReferenceBlocks,
	referenceDiscriminationField,
	...renderElementProps
}: BlockEditorElementRendererProps) => {
	const { attributes, children, element } = renderElementProps
	if (isBlockVoidReferenceElement(element)) {
		if (referenceDiscriminationField === undefined) {
			throw new BindingError()
		}
		return (
			<EntityKeyProvider entityKey={element.referenceId}>
				<BlockVoidReferenceElementRenderer
					attributes={attributes}
					children={children}
					element={element}
					referenceDiscriminationField={referenceDiscriminationField}
					normalizedReferenceBlocks={normalizedReferenceBlocks}
				/>
			</EntityKeyProvider>
		)
	}
	if (isContemberFieldElement(element)) {
		return (
			<BlockEditorGetNormalizedFieldBackedElementContext.Consumer>
				{getNormalizedFieldBackedElement => (
					<ContemberFieldElementRenderer
						attributes={attributes}
						children={children}
						element={element}
						fieldBackedElement={getNormalizedFieldBackedElement(element)}
					/>
				)}
			</BlockEditorGetNormalizedFieldBackedElementContext.Consumer>
		)
	}
	if (isEmbedElement(element)) {
		return (
			<EntityKeyProvider entityKey={element.referenceId}>
				<EmbedElementRenderer
					attributes={attributes}
					children={children}
					element={element}
					embedSubBlocks={embedSubBlocks}
					embedHandlers={embedHandlers}
					embedContentDiscriminationField={embedContentDiscriminationField}
					embedReferenceDiscriminateBy={embedReferenceDiscriminateBy}
				/>
			</EntityKeyProvider>
		)
	}
	if (isContemberContentPlaceholderElement(element)) {
		return (
			<div {...attributes}>
				<EditorPlaceholder>{element.placeholder}</EditorPlaceholder>
				{children}
			</div>
		)
	}
	return fallbackRenderer(renderElementProps)
}
