import { BindingError, FieldValue, RelativeSingleField } from '@contember/binding'
import { EditorPlaceholder } from '@contember/ui'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { RenderElementProps } from 'slate-react'
import { NormalizedBlocks } from '../../../blocks'
import { BlockElement, ElementNode } from '../../baseEditor'
import { isContemberContentPlaceholderElement, isContemberFieldElement, isReferenceElement } from '../elements'
import { NormalizedEmbedHandlers } from '../embed'
import { FieldBackedElement } from '../FieldBackedElement'
import { EditorReferenceBlocks } from '../templating'
import { ContemberFieldElementRenderer } from './ContemberFieldElementRenderer'
import { ReferenceElementRenderer } from './ReferenceElementRenderer'

export interface BlockEditorElementRendererProps extends RenderElementProps {
	element: ElementNode
	referenceDiscriminationField: RelativeSingleField | undefined
	editorReferenceBlocks: EditorReferenceBlocks
	fallbackRenderer: (props: RenderElementProps) => ReactElement

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
	if (isReferenceElement(element)) {
		if (referenceDiscriminationField === undefined) {
			throw new BindingError()
		}
		return (
			<ReferenceElementRenderer
				attributes={attributes}
				children={children}
				element={element}
				editorReferenceBlocks={editorReferenceBlocks}
				referenceDiscriminationField={referenceDiscriminationField}
				embedSubBlocks={embedSubBlocks}
				embedHandlers={embedHandlers}
				embedContentDiscriminationField={embedContentDiscriminationField}
				embedReferenceDiscriminateBy={embedReferenceDiscriminateBy}
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
