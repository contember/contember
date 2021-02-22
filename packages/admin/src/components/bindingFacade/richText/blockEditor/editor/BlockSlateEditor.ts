import { EntityAccessor, FieldValue } from '@contember/binding'
import * as Slate from 'slate'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../../baseEditor'
import { ContemberContentPlaceholderElement, ContemberFieldElement, ReferenceElement } from '../elements'

export type BlockEditorElements = ReferenceElement | ContemberContentPlaceholderElement | ContemberFieldElement

export interface WithBlockElements<E extends WithAnotherNodeType<BaseEditor, BlockEditorElements>> {
	slate: typeof Slate
	isReferenceElement: (node: Slate.Node) => node is ReferenceElement
	isContemberContentPlaceholderElement: (node: Slate.Node) => node is ContemberContentPlaceholderElement
	isContemberFieldElement: (node: Slate.Node) => node is ContemberFieldElement
	createElementReference: (referenceDiscriminant: FieldValue, initialize?: EntityAccessor.BatchUpdatesHandler) => string
	insertElementWithReference: <Element extends ElementNode>(
		element: Omit<Element, 'referenceId'>,
		referenceDiscriminant: FieldValue,
		initialize?: EntityAccessor.BatchUpdatesHandler,
	) => void
	slateOnChange: () => void
}

export type EditorWithBlockElements<E extends BaseEditor> = WithAnotherNodeType<E, BlockEditorElements> &
	WithBlockElements<WithAnotherNodeType<E, BlockEditorElements>>

export type BlockSlateEditor = EditorWithBlockElements<BaseEditor>
