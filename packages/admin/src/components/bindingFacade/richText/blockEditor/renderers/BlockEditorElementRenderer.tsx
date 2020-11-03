import { BindingError, FieldValue, RelativeSingleField } from '@contember/binding'
import { EditorPlaceholder } from '@contember/ui'
import * as React from 'react'
import { RenderElementProps } from 'slate-react'
import { NormalizedBlocks } from '../../../blocks'
import { BlockElement, ElementNode } from '../../baseEditor'
import {
	isBlockReferenceElement,
	isBlockVoidReferenceElement,
	isContemberContentPlaceholderElement,
	isContemberFieldElement,
	isEmbedElement,
} from '../elements'
import { NormalizedEmbedHandlers } from '../embed/core'
import { FieldBackedElement } from '../FieldBackedElement'
import { EditorReferenceBlocks } from '../templating'
import { BlockReferenceElementRenderer } from './BlockReferenceElementRenderer'
import { BlockVoidReferenceElementRenderer } from './BlockVoidReferenceElementRenderer'
import { ContemberFieldElementRenderer } from './ContemberFieldElementRenderer'
import { EmbedElementRenderer } from './EmbedElementRenderer'

export interface BlockEditorElementRendererProps extends RenderElementProps {
	element: ElementNode
	referenceDiscriminationField: RelativeSingleField | undefined
	editorReferenceBlocks: EditorReferenceBlocks
	fallbackRenderer: (props: RenderElementProps) => React.ReactElement

	embedContentDiscriminationField: RelativeSingleField | undefined
	embedSubBlocks: NormalizedBlocks | undefined
	embedHandlers: NormalizedEmbedHandlers | undefined
	embedReferenceDiscriminateBy: FieldValue | undefined

	leadingFields: FieldBackedElement[]
	trailingFields: FieldBackedElement[]
}

export function BlockEditorElementRenderer({
	fallbackRenderer,
	editorReferenceBlocks,
	embedContentDiscriminationField,
	embedHandlers,
	embedReferenceDiscriminateBy,
	embedSubBlocks,
	referenceDiscriminationField,
	leadingFields,
	trailingFields,
	...renderElementProps
}: BlockEditorElementRendererProps) {
	const { attributes, children, element } = renderElementProps
	if (isBlockVoidReferenceElement(element)) {
		if (referenceDiscriminationField === undefined) {
			throw new BindingError()
		}
		return (
			<BlockVoidReferenceElementRenderer
				attributes={attributes}
				children={children}
				element={element}
				editorReferenceBlocks={editorReferenceBlocks}
				referenceDiscriminationField={referenceDiscriminationField}
			/>
		)
	}
	if (isBlockReferenceElement(element)) {
		if (referenceDiscriminationField === undefined) {
			throw new BindingError()
		}
		return (
			<BlockReferenceElementRenderer
				attributes={attributes}
				children={children}
				element={element}
				editorReferenceBlocks={editorReferenceBlocks}
				referenceDiscriminationField={referenceDiscriminationField}
			/>
		)
	}
	if (isContemberFieldElement(element)) {
		return (
			<ContemberFieldElementRenderer
				attributes={attributes}
				children={children}
				element={element}
				leadingFields={leadingFields}
				trailingFields={trailingFields}
			/>
		)
	}
	if (isEmbedElement(element)) {
		return (
			<EmbedElementRenderer
				attributes={attributes}
				children={children}
				element={element}
				embedSubBlocks={embedSubBlocks}
				embedHandlers={embedHandlers}
				embedContentDiscriminationField={embedContentDiscriminationField}
				embedReferenceDiscriminateBy={embedReferenceDiscriminateBy}
			/>
		)
	}
	if (isContemberContentPlaceholderElement(element)) {
		return (
			<BlockElement attributes={attributes} element={element}>
				<EditorPlaceholder>{element.placeholder}</EditorPlaceholder>
				{children}
			</BlockElement>
		)
	}
	return fallbackRenderer(renderElementProps)
}
