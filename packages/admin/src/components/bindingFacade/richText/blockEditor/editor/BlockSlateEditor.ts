import { EntityAccessor, FieldValue } from '@contember/binding'
import * as Slate from 'slate'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../../baseEditor'
import {
	ContemberContentPlaceholderElement,
	ContemberFieldElement,
	ElementWithReference,
	ReferenceElement,
} from '../elements'

export type BlockEditorElements = ReferenceElement | ContemberContentPlaceholderElement | ContemberFieldElement

export interface WithBlockElements<E extends WithAnotherNodeType<BaseEditor, BlockEditorElements>> {
	slate: typeof Slate
	isReferenceElement: (node: Slate.Node) => node is ReferenceElement
	isContemberContentPlaceholderElement: (node: Slate.Node) => node is ContemberContentPlaceholderElement
	isContemberFieldElement: (node: Slate.Node) => node is ContemberFieldElement
	createReferencedEntity: (blockIndex: number, initialize?: EntityAccessor.BatchUpdatesHandler) => void

	// Really, try to avoid passing just the referenceId at all costs
	getReferencedEntity: (elementOrReferenceId: ElementWithReference | string) => EntityAccessor
	prepareElementForInsertion: (element: ElementNode) => Slate.Path
	createElementReference: (
		targetPath: Slate.Path,
		referenceDiscriminant: FieldValue,
		initialize?: EntityAccessor.BatchUpdatesHandler,
	) => string
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
